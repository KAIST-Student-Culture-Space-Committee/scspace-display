type Subscriber = (value: string) => void;

const subscribers = new Set<Subscriber>();
let latestText = '';

export function getLatestText() {
    return latestText;
}

export function setLatestText(value: string) {
    latestText = value;
    subscribers.forEach((subscriber) => subscriber(value));
}

export function subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);
    return () => {
        subscribers.delete(subscriber);
    };
}
