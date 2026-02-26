import { useEffect, useRef } from 'react';
import { rpc, scValToNative } from '@stellar/stellar-sdk';

export function useSorobanEvents(
    contractId: string,
    rpcUrl: string,
    onEvent: (topic: string, data: any) => void
) {
    const lastCursor = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!contractId || !rpcUrl) return;

        const server = new rpc.Server(rpcUrl);

        // Poll every 3 seconds
        const interval = setInterval(async () => {
            try {
                let startLedger: number | undefined;

                // If we don't have a cursor, we just fetch the last few ledgers to avoid huge payloads
                if (!lastCursor.current) {
                    const latestLedger = await server.getLatestLedger();
                    startLedger = Math.max(0, latestLedger.sequence - 10);
                }

                const eventsRequest: any = {
                    startLedger,
                    filters: [
                        {
                            type: "contract",
                            contractIds: [contractId],
                        },
                    ],
                };

                if (lastCursor.current) {
                    eventsRequest.pagination = { cursor: lastCursor.current };
                }

                const response = await server.getEvents(eventsRequest);

                if (response.events && response.events.length > 0) {
                    response.events.forEach((event) => {
                        // Soroban publishes events with topics as an array of ScVal
                        if (event.topic && event.topic.length > 1) {
                            try {
                                // Topic [0] is usually the contract name or generic tracker
                                // Topic [1] is our specific event name like 'FundsLocked'
                                const eventName = scValToNative(event.topic[1]);
                                const eventData = event.value ? scValToNative(event.value) : null;
                                onEvent(eventName, eventData);
                            } catch (e) {
                                console.error("Failed to parse event", e);
                            }
                        }
                    });

                    // Update cursor to the paging token of the last event
                    lastCursor.current = (response.events[response.events.length - 1] as any).pagingToken || (response.events[response.events.length - 1] as any).id;
                }
            } catch (err) {
                console.error("Error fetching Soroban events:", err);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [contractId, rpcUrl, onEvent]);
}
