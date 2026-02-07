export interface EmailLog {
    id: string
    recipient?: string
    from?: string
    to?: string[]
    subject: string
    created_at: string
    status: 'sent' | 'delivered' | 'delivery_delayed' | 'complained' | 'bounced' | 'opened' | 'clicked' | 'failed' | 'suppressed'
    error_message?: string
}
