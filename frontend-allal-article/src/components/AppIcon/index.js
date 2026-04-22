import { forwardRef } from "react";
import PropTypes from "prop-types";
import AddIcon from "@mui/icons-material/Add";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DateRangeIcon from "@mui/icons-material/DateRange";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import DoneIcon from "@mui/icons-material/Done";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ErrorIcon from "@mui/icons-material/Error";
import ExtensionIcon from "@mui/icons-material/Extension";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HomeIcon from "@mui/icons-material/Home";
import HubIcon from "@mui/icons-material/Hub";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyIcon from "@mui/icons-material/Key";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaidIcon from "@mui/icons-material/Paid";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublicIcon from "@mui/icons-material/Public";
import RemoveIcon from "@mui/icons-material/Remove";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import TranslateIcon from "@mui/icons-material/Translate";
import WarningIcon from "@mui/icons-material/Warning";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import WifiIcon from "@mui/icons-material/Wifi";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const ICON_MAP = {
  account_circle: AccountCircleIcon,
  add: AddIcon,
  arrow_backward: ArrowBackIcon,
  arrow_downward: ArrowDownwardIcon,
  arrow_forward: ArrowForwardIcon,
  arrow_upward: ArrowUpwardIcon,
  check: CheckIcon,
  close: CloseIcon,
  date_range: DateRangeIcon,
  delete: DeleteIcon,
  done: DoneIcon,
  donut_large: DonutLargeIcon,
  edit: EditIcon,
  emoji_events: EmojiEventsIcon,
  error: ErrorIcon,
  extension: ExtensionIcon,
  favorite: FavoriteIcon,
  home: HomeIcon,
  hub: HubIcon,
  inventory_2: Inventory2Icon,
  keyboard_arrow_down: KeyboardArrowDownIcon,
  key: KeyIcon,
  library_books: LibraryBooksIcon,
  menu: MenuIcon,
  more_horiz: MoreHorizIcon,
  more_vert: MoreVertIcon,
  notifications: NotificationsIcon,
  paid: PaidIcon,
  payment: PaymentIcon,
  person: PersonIcon,
  picture_as_pdf: PictureAsPdfIcon,
  play_arrow: PlayArrowIcon,
  public: PublicIcon,
  remove: RemoveIcon,
  search: SearchIcon,
  security: SecurityIcon,
  settings: SettingsIcon,
  shopping_cart: ShoppingCartIcon,
  skip_next: SkipNextIcon,
  skip_previous: SkipPreviousIcon,
  touch_app: TouchAppIcon,
  translate: TranslateIcon,
  warning: WarningIcon,
  watch_later: WatchLaterIcon,
  warehouse: WarehouseIcon,
  wifi: WifiIcon,
  admin_panel_settings: AdminPanelSettingsIcon,
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

AppIcon.displayName = "AppIcon";

export default AppIcon;
