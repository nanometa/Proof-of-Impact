export default function Spinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  const borderSize = size === 'sm' ? 'border-[2px]' : 'border-[2.5px]'
  return (
    <div className={`${sizeClass} ${borderSize} border-purple/20 border-t-purple rounded-full spin-slow`} />
  )
}
