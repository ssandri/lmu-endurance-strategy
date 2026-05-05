export default function StatusBadge({ variant, children, ...rest }) {
  return <span className={`badge badge-${variant}`} {...rest}>{children}</span>;
}
