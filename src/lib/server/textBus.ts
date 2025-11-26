import { HISTORY_LIMIT } from "../../static/const";

type Subscriber = (value: string) => void;

const subscribers = new Set<Subscriber>();
const history: string[] = [];
let latestText = '';

export function getLatestText() {
    return latestText;
}

export function getHistory() {
    return [...history];
}

export function setLatestText(value: string) {
    latestText = value;
    history.push(value);
    if (history.length > HISTORY_LIMIT) {
        history.shift();
    }
    subscribers.forEach((subscriber) => subscriber(value));
}

export function subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);
    return () => {
        subscribers.delete(subscriber);
    };
}
