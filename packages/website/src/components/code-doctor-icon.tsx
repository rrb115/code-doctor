const DEFAULT_ICON_SIZE_PX = 40;

interface ReactDoctorIconProps {
  sizePx?: number;
  className?: string;
  alt?: string;
}

const ReactDoctorIcon = ({
  sizePx = DEFAULT_ICON_SIZE_PX,
  className,
  alt = "Code Doctor icon",
}: ReactDoctorIconProps) => (
  <img
    src="/code-doctor-icon.svg"
    width={sizePx}
    height={sizePx}
    alt={alt}
    className={className}
  />
);

export default ReactDoctorIcon;
