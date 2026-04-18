import { forwardRef } from "react";
import PropTypes from "prop-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExtensionIcon from "@mui/icons-material/Extension";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HomeIcon from "@mui/icons-material/Home";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaidIcon from "@mui/icons-material/Paid";
import PaymentIcon from "@mui/icons-material/Payment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import WifiIcon from "@mui/icons-material/Wifi";

const ICON_MAP = {
  add: AddIcon,
  arrow_backward: ArrowBackIcon,
  arrow_downward: ArrowDownwardIcon,
  arrow_forward: ArrowForwardIcon,
  arrow_upward: ArrowUpwardIcon,
  close: CloseIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  emoji_events: EmojiEventsIcon,
  extension: ExtensionIcon,
  home: HomeIcon,
  library_books: LibraryBooksIcon,
  menu: MenuIcon,
  more_horiz: MoreHorizIcon,
  notifications: NotificationsIcon,
  paid: PaidIcon,
  payment: PaymentIcon,
  picture_as_pdf: PictureAsPdfIcon,
  play_arrow: PlayArrowIcon,
  public: PublicIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  shopping_cart: ShoppingCartIcon,
  skip_next: SkipNextIcon,
  skip_previous: SkipPreviousIcon,
  touch_app: TouchAppIcon,
  wifi: WifiIcon,
};

const AppIcon = forwardRef(({ children, ...props }, ref) => {
  const iconName = typeof children === "string" ? children.trim() : "";
  const IconComponent = ICON_MAP[iconName] || (iconName ? HelpOutlineIcon : DescriptionIcon);

  return <IconComponent ref={ref} {...props} />;
});

AppIcon.propTypes = {
  children: PropTypes.node,
};

AppIcon.defaultProps = {
  children: null,
};

export default AppIcon;
