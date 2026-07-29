type AvatarProps = {
  avatarUrl?: string | null
  initials: string
  tone?: 'pink' | 'orange'
  size?: 'md' | 'lg'
}

export default function Avatar({
  avatarUrl,
  initials,
  tone = 'pink',
  size = 'md',
}: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        alt={initials}
        className={`chat-avatar chat-avatar--${tone} chat-avatar--${size}`}
        src={avatarUrl}
      />
    )
  }

  return (
    <span className={`chat-avatar chat-avatar--${tone} chat-avatar--${size}`}>
      {initials}
    </span>
  )
}
