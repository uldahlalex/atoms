import {atom, Getter, Setter, useAtom, useAtomValue, SetStateAction, useSetAtom, Atom, WritableAtom} from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useEffect, useRef } from 'react';

type Callback<Value> = (
    newVal: Value,
    prevVal: Value
) => void;

export function atomWithStorageAndListeners<Value>(key: string, initialValue: Value, debugLabel?: string): [ WritableAtom<Value, [arg: SetStateAction<Value>], void>, (callback: Callback<Value>) => void] {
    const baseAtom = atomWithStorage(key, initialValue);
    baseAtom.debugLabel = debugLabel ? `${debugLabel}_base` : undefined;


    const listenersAtom = atom<Callback<Value>[]>([]);
    listenersAtom.debugLabel = debugLabel ? `${debugLabel}_listeners` : undefined;



    const anAtom = atom(
        (get) => get(baseAtom),
        (get, set, arg: SetStateAction<Value>) => {
            const prevVal = get(baseAtom);
            set(baseAtom, arg);
            const newVal = get(baseAtom);
            get(listenersAtom).forEach((callback) => {
                callback(newVal, prevVal);
            });
        },
    );

    const useListener = (callback: Callback<Value>) => {
        const setListeners = useSetAtom(listenersAtom);
        useEffect(() => {
            setListeners((prev) => [...prev, callback]);
            return () => setListeners((prev) => {
                const index = prev.indexOf(callback);
                return [...prev.slice(0, index), ...prev.slice(index + 1)];
            });
        }, [setListeners, callback]);
    };

    anAtom.debugLabel = debugLabel;
    return [anAtom, useListener] as const;
}

export function atomWithListeners<Value>(key: string, initialValue: Value, debugLabel?: string): [ WritableAtom<Value, [arg: SetStateAction<Value>], void>, (callback: Callback<Value>) => void] {
    const baseAtom = atom(initialValue);
    baseAtom.debugLabel = debugLabel ? `${debugLabel}_base` : undefined;

    const listenersAtom = atom<Callback<Value>[]>([]);
    listenersAtom.debugLabel = debugLabel ? `${debugLabel}_listeners` : undefined;

    const anAtom = atom(
        (get) => get(baseAtom),
        (get, set, arg: SetStateAction<Value>) => {
            const prevVal = get(baseAtom);
            set(baseAtom, arg);
            const newVal = get(baseAtom);
            get(listenersAtom).forEach((callback) => {
                callback(newVal, prevVal);
            });
        },
    );

    const useListener = (callback: Callback<Value>) => {
        const setListeners = useSetAtom(listenersAtom);
        useEffect(() => {
            setListeners((prev) => [...prev, callback]);
            return () => setListeners((prev) => {
                const index = prev.indexOf(callback);
                return [...prev.slice(0, index), ...prev.slice(index + 1)];
            });
        }, [setListeners, callback]);
    };

    anAtom.debugLabel = debugLabel;


    return [anAtom, useListener] as const;
}



export function derivedAtomWithListeners<Value, DerivedValue>(
    baseAtom: ReturnType<typeof atomWithListeners<Value>>[0],
    deriveFn: (get: Getter, value: Value) => DerivedValue,
    debugLabel?: string
): [Atom<DerivedValue>, (callback: Callback<DerivedValue>) => void] {
    const derivedAtom = atom((get) => {
        const baseValue = get(baseAtom);
        return deriveFn(get, baseValue);
    });

    derivedAtom.debugLabel = debugLabel ? `${debugLabel}_derived` : undefined;

    const listenersAtom = atom<Callback<DerivedValue>[]>([]);

    listenersAtom.debugLabel = debugLabel ? `${debugLabel}_listeners` : undefined;

    const useListener = (callback: Callback<DerivedValue>) => {
        const setListeners = useSetAtom(listenersAtom);
        useEffect(() => {
            setListeners((prev) => [...prev, callback]);
            return () => setListeners((prev) => {
                const index = prev.indexOf(callback);
                return [...prev.slice(0, index), ...prev.slice(index + 1)];
            });
        }, [setListeners, callback]);

        const derivedValue = useAtomValue(derivedAtom);
        const prevDerivedValue = useRef(derivedValue);

        useEffect(() => {
            const newDerivedValue = derivedValue;
            if (newDerivedValue !== prevDerivedValue.current) {
                callback(newDerivedValue, prevDerivedValue.current);
                prevDerivedValue.current = newDerivedValue;
            }
        }, [derivedValue, callback]);
    };

    return [derivedAtom, useListener] as const;
}