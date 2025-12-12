"use client";

import { useState, useEffect } from "react";
import { SurveyCreationScreen } from "@/components/screens/SurveyCreationScreen";
import { useParams } from "next/navigation";

export default function EditSurveyPage() {
    const params = useParams();
    const surveyId = params?.id as string;
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setInitialData({ survey: data });
                }
            } catch (error) {
                console.error("Failed to fetch survey", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSurvey();
    }, [surveyId]);

    if (isLoading) return <div>Loading...</div>;

    return (
        <SurveyCreationScreen
            mode="edit"
            surveyId={surveyId}
            initialData={initialData}
        />
    );
}
