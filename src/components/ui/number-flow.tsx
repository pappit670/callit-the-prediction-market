// This file integrates NumberFlow library explicitly as requested
import NumberFlow, { type NumberFlowProps } from "@number-flow/react";

export function CustomNumberFlow({
  value,
  trend,
  format,
  className,
  ...props
}: NumberFlowProps) {
  return (
    <NumberFlow
      value={value}
      trend={trend}
      format={format}
      className={className}
      {...props}
    />
  );
}

export default NumberFlow;
