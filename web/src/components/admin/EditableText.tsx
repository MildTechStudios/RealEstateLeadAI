import { useState, useEffect, useRef } from 'react'
import { Pencil } from 'lucide-react'

interface EditableTextProps {
    value: string
    isEditing: boolean
    onChange: (value: string) => void
    className?: string
    style?: React.CSSProperties
    multiline?: boolean
    placeholder?: string
}

export function EditableText({
    value,
    isEditing,
    onChange,
    className = "",
    style,
    multiline = false,
    placeholder = "Click to edit..."
}: EditableTextProps) {
    const [localValue, setLocalValue] = useState(value)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync from parent if not currently focused (simplified)
    useEffect(() => {
        setLocalValue(value)
        if (containerRef.current && containerRef.current.innerText !== value) {
            containerRef.current.innerText = value || ''
        }
    }, [value])

    if (!isEditing) {
        return (
            <div className={className} style={{ ...style, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
                {value || <span className="opacity-0">.</span>}
            </div>
        )
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const text = e.currentTarget.innerText
        if (text !== value) {
            onChange(text)
        }
    }

    return (
        <div className="relative group">
            <div
                ref={containerRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                className={`outline-none min-w-[20px] transition-all bg-primary/10 hover:bg-primary/20 rounded px-2 -mx-2 border border-primary/30 border-dashed focus:border-solid focus:border-primary focus:bg-white focus:text-slate-900 z-50 relative ${className}`}
                style={{
                    ...style,
                    whiteSpace: multiline ? 'pre-wrap' : 'normal',
                    cursor: 'text'
                }}
            />
            <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                <div className="flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    Edit
                </div>
            </div>
        </div>
    )
}
