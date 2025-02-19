export interface CanvasPinAdapterProps {
  onGoToPin?: (position: { x: number; y: number }) => void;
}

export interface CanvasSides {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
