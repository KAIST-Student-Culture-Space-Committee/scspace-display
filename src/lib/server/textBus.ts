import { HISTORY_LIMIT } from '../../static/const';

type TextEvent = {
    type: 'text';
    text: string;
};

type RefreshEvent = {
    type: 'refresh';
    timestamp: number;
};

export type BusEvent = TextEvent | RefreshEvent;
type Subscriber = (value: BusEvent) => void;

const subscribers = new Set<Subscriber>();
const history: TextEvent[] = [];
let latestTextEvent: TextEvent = { type: 'text', text: '' };

export function getLatestTextEvent() {
    return latestTextEvent;
}

export function getHistory() {
    return [...history];
}

export function setLatestText(value: string) {
    const event: TextEvent = { type: 'text', text: value };
    latestTextEvent = event;
    history.push(event);
    if (history.length > HISTORY_LIMIT) {
        history.shift();
    }
    subscribers.forEach((subscriber) => subscriber(event));
}

export function broadcastRefresh() {
    const event: RefreshEvent = { type: 'refresh', timestamp: Date.now() };
    subscribers.forEach((subscriber) => subscriber(event));
}

export function subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);
    return () => {
        subscribers.delete(subscriber);
    };
}
