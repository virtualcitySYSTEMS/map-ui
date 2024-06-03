import TwoDAreaIcon from './2DAreaIcon.vue';
import TwoDDistanceIcon from './2DDistanceIcon.vue';
import TwoDHeightObliqueIcon from './2DHeightObliqueIcon.vue';
import TwoDPointIcon from './2DPointIcon.vue';
import ThreeDAreaIcon from './3DAreaIcon.vue';
import ThreeDDistanceIcon from './3DDistanceIcon.vue';
import ThreeDHeightIcon from './3DHeightIcon.vue';
import ThreeDPointIcon from './3DPointIcon.vue';
import AngleIcon from './AngleIcon.vue';
import AssociationsIcon from './AssociationsIcon.vue';
import AxisIcon from './AxisIcon.vue';
import BoundingBoxIcon from './BoundingBoxIcon.vue';
import CheckboxCheckedIcon from './CheckboxCheckedIcon.vue';
import CheckboxIcon from './CheckboxIcon.vue';
import CheckboxIndeterminateIcon from './CheckboxIndeterminateIcon.vue';
import CircleIcon from './CircleIcon.vue';
import ClippingIcon from './ClippingIcon.vue';
import ClippingHorizontalIcon from './ClippingHorizontalIcon.vue';
import ClippingVerticalIcon from './ClippingVerticalIcon.vue';
import ColorPickerIcon from './ColorPickerIcon.vue';
import ColorSwatchIcon from './ColorSwatchIcon.vue';
import CommentIcon from './CommentIcon.vue';
import CompassIcon from './CompassIcon.vue';
import ComponentsIcon from './ComponentsIcon.vue';
import ComponentsPlusIcon from './ComponentsPlusIcon.vue';
import ConeIcon from './ConeIcon.vue';
import CrosshairIcon from './CrosshairIcon.vue';
import DimensionsHouseIcon from './DimensionsHouseIcon.vue';
import EditIcon from './EditIcon.vue';
import EditVerticesIcon from './EditVerticesIcon.vue';
import ElevationProfileIcon from './ElevationProfileIcon.vue';
import ExportAreaIcon from './ExportAreaIcon.vue';
import ExportFlightIcon from './ExportFlightIcon.vue';
import ExportIcon from './ExportIcon.vue';
import ExternalLinkIcon from './ExternalLinkIcon.vue';
import EyeIcon from './EyeIcon.vue';
import FastForwardIcon from './FastForwardIcon.vue';
import FilterIcon from './FilterIcon.vue';
import GlobalTerrainIcon from './GlobalTerrainIcon.vue';
import GlobeNatureIcon from './GlobeNatureIcon.vue';
import GroundIcon from './GroundIcon.vue';
import HealthCareIndustriesIcon from './HealthCareIndustriesIcon.vue';
import HelpIcon from './HelpIcon.vue';
import HideIcon from './HideIcon.vue';
import HomePointIcon from './HomePointIcon.vue';
import HospitalsIcon from './HospitalsIcon.vue';
import HouseIcon from './HouseIcon.vue';
import ImportIcon from './ImportIcon.vue';
import InfoIcon from './InfoIcon.vue';
import KebabIcon from './KebabIcon.vue';
import LabelIcon from './LabelIcon.vue';
import LayersIcon from './LayersIcon.vue';
import LegendIcon from './LegendIcon.vue';
import LineIcon from './LineIcon.vue';
import LinkIcon from './LinkIcon.vue';
import LogoutIcon from './LogoutIcon.vue';
import ProgressIcon from './ProgressIcon.vue';
import MapIcon from './MapIcon.vue';
import MenuIcon from './MenuIcon.vue';
import MinusIcon from './MinusIcon.vue';
import MultiViewIcon from './MultiViewIcon.vue';
import ObjectAttributeIcon from './ObjectAttributeIcon.vue';
import ObjectSelectIcon from './ObjectSelectIcon.vue';
import ObliqueViewIcon from './ObliqueViewIcon.vue';
import PdfIcon from './PdfIcon.vue';
import PedestrianIcon from './PedestrianIcon.vue';
import PenIcon from './PenIcon.vue';
import PlayCircleIcon from './PlayCircleIcon.vue';
import PlusIcon from './PlusIcon.vue';
import PoiIcon from './PoiIcon.vue';
import PointMeasurementIcon from './PointMeasurementIcon.vue';
import PointSelectIcon from './PointSelectIcon.vue';
import PointIcon from './PointIcon.vue';
import QueryIcon from './QueryIcon.vue';
import PresentationModeIcon from './PresentationModeIcon.vue';
import RectangleIcon from './RectangleIcon.vue';
import ReturnIcon from './ReturnIcon.vue';
import RewindIcon from './RewindIcon.vue';
import RotateLeftIcon from './RotateLeftIcon.vue';
import RotateRightIcon from './RotateRightIcon.vue';
import ScreenshotIcon from './ScreenshotIcon.vue';
import SearchIcon from './SearchIcon.vue';
import ShadowIcon from './ShadowIcon.vue';
import ShapesIcon from './ShapesIcon.vue';
import ShareIcon from './ShareIcon.vue';
import SimpleCircleFilledIcon from './SimpleCircleFilledIcon.vue';
import SimpleCircleHalfFilledIcon from './SimpleCircleHalfFilledIcon.vue';
import SimpleCircleOutlinedIcon from './SimpleCircleOutlinedIcon.vue';
import SkipNextIcon from './SkipNextIcon.vue';
import SkipPreviousIcon from './SkipPreviousIcon.vue';
import SplitViewIcon from './SplitViewIcon.vue';
import TerrainBoxIcon from './TerrainBoxIcon.vue';
import TextStyleIcon from './TextStyleIcon.vue';
import ThreeDimensionsIcon from './ThreeDimensionsIcon.vue';
import ToolsIcon from './ToolsIcon.vue';
import TouchIcon from './TouchIcon.vue';
import TransparentTerrainIcon from './TransparentTerrainIcon.vue';
import TrashCanIcon from './TrashCanIcon.vue';
import TriangleIcon from './TriangleIcon.vue';
import TwoDimensionsIcon from './TwoDimensionsIcon.vue';
import UploadIcon from './UploadIcon.vue';
import UserProfileIcon from './UserProfileIcon.vue';
import UserShareIcon from './UserShareIcon.vue';
import VideoRecorderIcon from './VideoRecorderIcon.vue';
import ViewpointIcon from './ViewpointIcon.vue';
import ViewpointFlightIcon from './ViewpointFlightIcon.vue';
import ViewshedIcon from './ViewshedIcon.vue';
import Viewshed360Icon from './Viewshed360Icon.vue';
import ViewshedConeIcon from './ViewshedConeIcon.vue';
import WalkingIcon from './WalkingIcon.vue';
import WallIcon from './WallIcon.vue';
import WandIcon from './WandIcon.vue';

// * // IconMap.boundingBox
// * <v-icon size="16" v-text="'$vcsBoundingBox'" />
// * // Material Design Icons
// * <v-icon size="16" v-text="'mdi-fast-forward'" />
// *
// * Enum for Icon values.
// * Final values must be camel-cased and prefixed with '$vcs'.
// * Additional icons can be found at https://materialdesignicons.com/
// * They must be kebab-cased and prefixed with 'mdi-'

/**
 * @module Icon
 */
/**
 * @typedef Icon
 * @type {Object}
 * @property {Object.<string, Object>} Map
 */

/**
 * @readonly
 * @enum {Icon}
 */
const IconMap = {
  '2d': {
    component: TwoDimensionsIcon,
  },
  '2dArea': {
    component: TwoDAreaIcon,
  },
  '2dDistance': {
    component: TwoDDistanceIcon,
  },
  '2dHeightOblique': {
    component: TwoDHeightObliqueIcon,
  },
  '2dPoint': {
    component: TwoDPointIcon,
  },
  '3d': {
    component: ThreeDimensionsIcon,
  },
  '3dArea': {
    component: ThreeDAreaIcon,
  },
  '3dDistance': {
    component: ThreeDDistanceIcon,
  },
  '3dHeight': {
    component: ThreeDHeightIcon,
  },
  '3dPoint': {
    component: ThreeDPointIcon,
  },
  angle: {
    component: AngleIcon,
  },
  associations: {
    component: AssociationsIcon,
  },
  axis: {
    component: AxisIcon,
  },
  boundingBox: {
    component: BoundingBoxIcon,
  },
  checkbox: {
    component: CheckboxIcon,
  },
  checkboxChecked: {
    component: CheckboxCheckedIcon,
  },
  checkboxIndeterminate: {
    component: CheckboxIndeterminateIcon,
  },
  circle: {
    component: CircleIcon,
  },
  clipping: {
    component: ClippingIcon,
  },
  clippingHorizontal: {
    component: ClippingHorizontalIcon,
  },
  clippingVertical: {
    component: ClippingVerticalIcon,
  },
  colorPicker: {
    component: ColorPickerIcon,
  },
  colorSwatch: {
    component: ColorSwatchIcon,
  },
  comment: {
    component: CommentIcon,
  },
  components: {
    component: ComponentsIcon,
  },
  componentsPlus: {
    component: ComponentsPlusIcon,
  },
  compass: {
    component: CompassIcon,
  },
  cone: {
    component: ConeIcon,
  },
  crosshair: {
    component: CrosshairIcon,
  },
  dimensionsHouse: {
    component: DimensionsHouseIcon,
  },
  edit: {
    component: EditIcon,
  },
  editVertices: {
    component: EditVerticesIcon,
  },
  elevationProfile: {
    component: ElevationProfileIcon,
  },
  export: {
    component: ExportIcon,
  },
  exportArea: {
    component: ExportAreaIcon,
  },
  exportFlight: {
    component: ExportFlightIcon,
  },
  externalLink: {
    component: ExternalLinkIcon,
  },
  eye: {
    component: EyeIcon,
  },
  fastForward: {
    component: FastForwardIcon,
  },
  filter: {
    component: FilterIcon,
  },
  GlobalTerrain: {
    component: GlobalTerrainIcon,
  },
  globeNature: {
    component: GlobeNatureIcon,
  },
  ground: {
    component: GroundIcon,
  },
  healthCareIndustries: {
    component: HealthCareIndustriesIcon,
  },
  help: {
    component: HelpIcon,
  },
  hide: {
    component: HideIcon,
  },
  homePoint: {
    component: HomePointIcon,
  },
  house: {
    component: HouseIcon,
  },
  hospitals: {
    component: HospitalsIcon,
  },
  import: {
    component: ImportIcon,
  },
  info: {
    component: InfoIcon,
  },
  kebab: {
    component: KebabIcon,
  },
  label: {
    component: LabelIcon,
  },
  layers: {
    component: LayersIcon,
  },
  legend: {
    component: LegendIcon,
  },
  line: {
    component: LineIcon,
  },
  link: {
    component: LinkIcon,
  },
  logout: {
    component: LogoutIcon,
  },
  progress: {
    component: ProgressIcon,
  },
  map: {
    component: MapIcon,
  },
  menu: {
    component: MenuIcon,
  },
  minus: {
    component: MinusIcon,
  },
  multiView: {
    component: MultiViewIcon,
  },
  objectAttribute: {
    component: ObjectAttributeIcon,
  },
  objectSelect: {
    component: ObjectSelectIcon,
  },
  obliqueView: {
    component: ObliqueViewIcon,
  },
  pdf: {
    component: PdfIcon,
  },
  pedestrian: {
    component: PedestrianIcon,
  },
  pen: {
    component: PenIcon,
  },
  playCircle: {
    component: PlayCircleIcon,
  },
  plus: {
    component: PlusIcon,
  },
  poi: {
    component: PoiIcon,
  },
  PointMeasurement: {
    component: PointMeasurementIcon,
  },
  pointSelect: {
    component: PointSelectIcon,
  },
  point: {
    component: PointIcon,
  },
  query: {
    component: QueryIcon,
  },
  presentationMode: {
    component: PresentationModeIcon,
  },
  rectangle: {
    component: RectangleIcon,
  },
  return: {
    component: ReturnIcon,
  },
  rewind: {
    component: RewindIcon,
  },
  rotateLeft: {
    component: RotateLeftIcon,
  },
  rotateRight: {
    component: RotateRightIcon,
  },
  screenshot: {
    component: ScreenshotIcon,
  },
  search: {
    component: SearchIcon,
  },
  shadow: {
    component: ShadowIcon,
  },
  shapes: {
    component: ShapesIcon,
  },
  share: {
    component: ShareIcon,
  },
  simpleCircleFilled: {
    component: SimpleCircleFilledIcon,
  },
  simpleCircleHalfFilled: {
    component: SimpleCircleHalfFilledIcon,
  },
  simpleCircleOutlined: {
    component: SimpleCircleOutlinedIcon,
  },
  skipNext: {
    component: SkipNextIcon,
  },
  skipPrevious: {
    component: SkipPreviousIcon,
  },
  splitView: {
    component: SplitViewIcon,
  },
  terrainBox: {
    component: TerrainBoxIcon,
  },
  textStyle: {
    component: TextStyleIcon,
  },
  tools: {
    component: ToolsIcon,
  },
  touch: {
    component: TouchIcon,
  },
  transparentTerrain: {
    component: TransparentTerrainIcon,
  },
  trashCan: {
    component: TrashCanIcon,
  },
  triangle: {
    component: TriangleIcon,
  },
  upload: {
    component: UploadIcon,
  },
  userProfile: {
    component: UserProfileIcon,
  },
  userShare: {
    component: UserShareIcon,
  },
  videoRecorder: {
    component: VideoRecorderIcon,
  },
  viewpoint: {
    component: ViewpointIcon,
  },
  viewpointFlight: {
    component: ViewpointFlightIcon,
  },
  viewshed: {
    component: ViewshedIcon,
  },
  viewshed360: {
    component: Viewshed360Icon,
  },
  viewshedCone: {
    component: ViewshedConeIcon,
  },
  wall: {
    component: WallIcon,
  },
  walking: {
    component: WalkingIcon,
  },
  wand: {
    component: WandIcon,
  },
};

const nameCapitalized = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const prefixed = (iconMap) => {
  return Object.entries(iconMap).reduce(
    (previousValue, [key, value]) => ({
      ...previousValue,
      [`vcs${nameCapitalized(key)}`]: value.component,
    }),
    {},
  );
};

const Icons = prefixed(IconMap);
export const IconIds = Object.keys(IconMap);
export const IconNames = Object.keys(Icons).map((name) => {
  return `$${name}`;
});
export default Icons;
