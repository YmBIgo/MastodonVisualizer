import type { QuestionFailedHistory, QuestionSuccessHistory } from "../type/QuestionHistory";

export function convertQuestionHistory(history: any): QuestionFailedHistory {
    if (!Array.isArray(history)) {
        return [];
    }
    return history.map((item: any) => {
        return {
            json: String(item.json) ?? "",
            jsonTitle: String(item.jsonTitle) ?? "",
            questionId: String(item.questionId) ?? "",
            questionString: String(item.questionString) ?? "",
            id: String(item.id) ?? "",
            failCount: isNaN(Number(item.failCount)) ? 0 : Number(item.failCount),
        };
    });
}

export function convertQuestionSuccessHistory(history: any): QuestionSuccessHistory {
    if (!Array.isArray(history)) {
        return [];
    }
    return history.map((item: any) => {
        return {
            json: String(item.json) ?? "",
            jsonTitle: String(item.jsonTitle) ?? "",
            questionId: String(item.questionId) ?? "",
            questionString: String(item.questionString) ?? "",
            successCount: isNaN(Number(item.successCount)) ? 0 : Number(item.successCount),
        };
    });
}