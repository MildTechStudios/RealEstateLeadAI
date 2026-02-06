import type { DBProfile } from '../../services/api'

interface LeadRowProps {
    profile: DBProfile
}

export function LeadRow({ profile }: LeadRowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
            {/* Agent Info */}
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden border border-slate-600">
                        {profile.headshot_url ? (
                            <img src={profile.headshot_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-slate-500 font-bold text-xs">
                                {profile.full_name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-white font-medium text-sm">{profile.full_name}</div>
                        <div className="text-slate-400 text-xs">{profile.brokerage}</div>
                    </div>
                </div>
            </td>

            {/* Location */}
            <td className="p-4 text-slate-300 text-sm">
                {profile.city && profile.state ? `${profile.city}, ${profile.state}` : <span className="text-slate-600">-</span>}
            </td>

            {/* Contacts */}
            <td className="p-4">
                <div className="flex flex-col gap-1">
                    {profile.primary_email && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="truncate max-w-[150px]">{profile.primary_email}</span>
                        </div>
                    )}
                    {profile.primary_phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span>{profile.primary_phone}</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Source */}
            <td className="p-4">
                <a
                    href={profile.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 text-xs hover:underline flex items-center gap-1"
                >
                    Link
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </td>

            {/* Date */}
            <td className="p-4 text-slate-500 text-xs">
                {formatDate(profile.updated_at)}
            </td>
        </tr>
    )
}
