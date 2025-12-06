export type QuestionFailedHistory = QuestionFailedHistoryItem[];

export type QuestionFailedHistoryItem = {
    json: string;
    jsonTitle: string;
    questionId: string;
    questionString: string;
    id: string;
    failCount: number;
};

export type QuestionSuccessHistory = QuestionSuccessHistoryItem[];

export type QuestionSuccessHistoryItem = {
    json: string;
    jsonTitle: string;
    questionId: string;
    questionString: string;
    successCount: number;
};