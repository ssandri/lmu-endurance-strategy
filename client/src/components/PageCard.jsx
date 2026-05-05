export default function PageCard({ children, className = '', ...rest }) {
  return <div className={`page-card ${className}`.trim()} {...rest}>{children}</div>;
}
