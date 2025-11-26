import { json, type RequestHandler } from '@sveltejs/kit';
import { getHistory, getLatestText, setLatestText, subscribe } from '$lib/server/textBus';

const encoder = new TextEncoder();
const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
};

const formatMessage = (payload: string) => encoder.encode(`data: ${payload}\n\n`);
const heartbeatChunk = encoder.encode(': keep-alive\n\n');

export const GET: RequestHandler = ({ url }) => {
    const newText = url.searchParams.get('text');
    if (newText !== null) {
        setLatestText(newText);
        return json({ text: newText });
    }

    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (value: string) => controller.enqueue(formatMessage(value));
            const history = getHistory();
            if (history.length === 0) {
                send(getLatestText());
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
