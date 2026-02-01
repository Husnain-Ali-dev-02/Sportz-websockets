import arcjet, {detectBot, shield, slidingWindow} from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJECT_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetKey) throw new Error('ARCJET_KEY environment variable is missing.');

export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW" ]}),
            slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
        ],
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW" ]}),
            slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
        ],
    }) : null;

/**
 * Create an Express-compatible middleware that enforces ArcJet protection on incoming requests.
 *
 * If ArcJet is not configured the middleware immediately calls `next()`. When ArcJet is configured,
 * the middleware evaluates the protection decision and:
 * - responds with HTTP 429 and `{ error: 'Too many requests.' }` when denied for rate limiting,
 * - responds with HTTP 403 and `{ error: 'Forbidden.' }` for other denials,
 * - responds with HTTP 503 and `{ error: 'Service Unavailable' }` if an internal error occurs.
 *
 * @returns {function(req: *, res: *, next: function): Promise<void>} An Express-style middleware function that applies ArcJet protection.
 */
export function securityMiddleware() {
    return async (req, res, next) => {
        if(!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req);

            if(decision.isDenied()) {
                if(decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too many requests.' });
                }

                return res.status(403).json({ error: 'Forbidden.' });
            }
        } catch (e) {
            console.error('Arcjet middleware error', e);
            return res.status(503).json({ error: 'Service Unavailable' });
        }

        next();
    }
}