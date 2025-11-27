import { json, type RequestHandler } from '@sveltejs/kit';
import {
    broadcastRefresh,
    getHistory,
    getLatestTextEvent,
    subscribe,
    type BusEvent
} from '$lib/server/textBus';

const encoder = new TextEncoder();
const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
};

const formatMessage = (payload: string) => encoder.encode(`data: ${payload}\n\n`);
const heartbeatChunk = encoder.encode(': keep-alive\n\n');

export const GET: RequestHandler = () => {
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (payload: BusEvent) =>
                controller.enqueue(formatMessage(JSON.stringify(payload))); // SSE expects strings
            const history = getHistory();
            if (history.length === 0) {
                send(getLatestTextEvent());
            } else {
                history.forEach((value) => send(value));
            }

            const unsubscribe = subscribe((value) => send(value));
            const heartbeat = setInterval(() => controller.enqueue(heartbeatChunk), 15000);

            cleanup = () => {
                clearInterval(heartbeat);
                unsubscribe();
            };
        },
        cancel() {
            cleanup?.();
        }
    });

    return new Response(stream, { headers: sseHeaders });
};

export const POST: RequestHandler = async () => {
    // TODO: fetch the latest message from the DB once it is available, then call setLatestText.
    broadcastRefresh();
    return json({ response: 'ok' });
};
