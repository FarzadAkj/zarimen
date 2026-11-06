export interface ErrorOutput {
    message: string,
    translation: string
}

export type ServerResponse<T> = {
    data?: T,
    error?: ErrorOutput
}