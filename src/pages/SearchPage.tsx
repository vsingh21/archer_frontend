import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConnectionData } from '../types';
import AutocompleteInput from '../components/AutocompleteInput';
import ConnectionResults from '../components/ConnectionResults';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SearchPage: React.FC = () => {

    const [confirmedInput1, setConfirmedInput1] = useState<string>('');
    const [confirmedInput2, setConfirmedInput2] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showConnection, setShowConnection] = useState<boolean>(false);
    const [data, setData] = useState<ConnectionData | null>(null);
    const [submitted1, setSubmitted1] = useState<string>('');
    const [submitted2, setSubmitted2] = useState<string>('');
    const [showVisitCounter, setShowVisitCounter] = useState<boolean>(false);

    const inputRef1 = useRef<HTMLInputElement>(null);
    const inputRef2 = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        const finalInput1 = confirmedInput1.trim();
        const finalInput2 = confirmedInput2.trim();

        if (!finalInput1 || !finalInput2) {
            console.log("One or both inputs are empty for fetch.");
            return;
        }

        setIsLoading(true);
        setData(null);
        setShowConnection(true);
        setSubmitted1(finalInput1);
        setSubmitted2(finalInput2);
        setShowVisitCounter(false);

        try {
            console.log(`Fetching connection between "${finalInput1}" and "${finalInput2}"`);
            const response = await fetch(`${API_BASE_URL}/api/getPath?person1=${encodeURIComponent(finalInput1)}&person2=${encodeURIComponent(finalInput2)}`);
            console.log("Connection API Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || errorData?.error || errorMessage;
                } catch (jsonError) {
                   if (response.status === 404) errorMessage = `Connection between ${finalInput1.split(" - ")[0]} and ${finalInput2.split(" - ")[0]} not found.`;
                }
                throw new Error(errorMessage);
            }

            const jsonData: ConnectionData = await response.json();
            console.log("Connection API Success data:", jsonData);
            if (jsonData && Array.isArray(jsonData.names) && Array.isArray(jsonData.relationships)) {
                setData(jsonData);
                setShowVisitCounter(true);

                setTimeout(() => {
                    setShowVisitCounter(false);
                }, 5000);
            } else {
                console.error("Received data is not in the expected ConnectionData format:", jsonData);
                setData(null);
                throw new Error("Received invalid data format from server.");
            }

        } catch (e: any) {
            console.error("Fetch connection error:", e);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [confirmedInput1, confirmedInput2]);

    const resetSearch = () => {
        setConfirmedInput1('');
        setConfirmedInput2('');
        setIsLoading(false);
        setShowConnection(false);
        setData(null);
        setSubmitted1('');
        setSubmitted2('');
        setShowVisitCounter(false);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        inputRef1.current?.focus();
    };

    useEffect(() => {
        if (!isLoading && showConnection && resultsContainerRef.current) {
            const timer = setTimeout(() => {
                resultsContainerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isLoading, showConnection, data]);

    return (
        <>
            <h1 className="title" title="Reset Search">
                <span onClick={resetSearch} style={{ cursor: 'pointer', display: 'inline-block' }}>
                    archer
                </span>
            </h1>

            <div className="search-container">
                <AutocompleteInput
                    id="input1"
                    ref={inputRef1}
                    placeholder="Enter first person"
                    initialValue={confirmedInput1}
                    onValueChange={setConfirmedInput1}
                    onValueConfirm={(value) => {
                        setConfirmedInput1(value);
                        inputRef2.current?.focus();
                    }}
                />

                <AutocompleteInput
                    id="input2"
                    ref={inputRef2}
                    placeholder="Enter second person"
                    initialValue={confirmedInput2}
                    onValueChange={setConfirmedInput2}
                    onValueConfirm={(value) => {
                        setConfirmedInput2(value);

                    }}
                    onSubmitSearch={fetchData}
                />
            </div>
            <div className={`visit-counter ${showVisitCounter ? '' : 'hidden'}`}>
                {data?.timesVisited !== undefined && (
                    <p>
                    {data.timesVisited - 1 === 0
                        ? "You are the first person to find this connection!"
                        : `This connection has been found ${data.timesVisited - 1} other time${data.timesVisited - 1> 1 ? 's' : ''}.`}
                    </p>
                )}
            </div>

            <button
                className="find-button"
                onClick={fetchData}
                disabled={isLoading || !confirmedInput1.trim() || !confirmedInput2.trim()}
            >
                {isLoading ? 'Finding...' : 'Find Connection'}
            </button>

            {showConnection && (
                <ConnectionResults
                    isLoading={isLoading}
                    data={data}
                    submitted1={submitted1}
                    submitted2={submitted2}
                    scrollRef={resultsContainerRef}
                />
            )}
        </>
    );
};

export default SearchPage;