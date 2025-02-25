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
import View360Icon from './View360Icon.vue';

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
  view360: {
    component: View360Icon,
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

/**
 * @param {string} color
 * @returns {import("ol/style/Icon").Options}
 */
export function getColoredMapIcon(color) {
  return {
    src: `data:image/svg+xml,%3Csvg xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:cc='http://creativecommons.org/ns%23' xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23' xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd' xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape' id='icon_24_poi' width='24' height='23.994' viewBox='0 0 24 23.994' sodipodi:docname='mapIcon.svg'%3E%3Cg id='Gruppe_1972' transform='translate(-571 -609.477)'%3E%3Cpath id='Pfad_773' d='M583,611a8.009,8.009,0,0,0-8,8c0,5.314,6.952,13.32,7.248,13.658a1,1,0,0,0,1.5,0c.3-.338,7.248-8.344,7.248-13.658A8.009,8.009,0,0,0,583,611Zm0,19.444c-2.18-2.685-6-8.09-6-11.444a6,6,0,0,1,12,0C589,622.354,585.18,627.759,583,630.444Z' fill='currentColor' /%3E%3Cpath id='Pfad_774' d='M583,615a4,4,0,1,0,4,4A4,4,0,0,0,583,615Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,583,621Z' fill='currentColor' /%3E%3C/g%3E%3Cpath fill='${encodeURIComponent(
      color,
    )}' d='M 11.672998,20.526286 C 8.5115524,16.526958 6.4310003,12.714969 6.0702695,10.260963 6.0109099,9.8571482 6.0115821,9.1201807 6.0716855,8.7084104 6.4424582,6.1682348 8.3335069,4.1603103 10.828528,3.6575721 c 1.904966,-0.383844 3.881822,0.1903514 5.289639,1.5364231 0.993092,0.9495349 1.610829,2.1488769 1.810148,3.5144152 0.0601,0.4117703 0.06077,1.1487378 0.0014,1.5525526 -0.357076,2.429138 -2.337816,6.081898 -5.487559,10.119822 -0.224045,0.287223 -0.415188,0.530536 -0.424763,0.540696 -0.0096,0.01016 -0.16456,-0.167678 -0.344411,-0.395195 z m 0.990366,-7.047968 c 0.894914,-0.146674 1.762065,-0.627065 2.349286,-1.301476 0.86707,-0.995812 1.194989,-2.3427819 0.880571,-3.6170541 -0.379849,-1.5394474 -1.596396,-2.6842781 -3.173401,-2.9863277 -0.368703,-0.070619 -1.070937,-0.070619 -1.43964,0 C 9.7056173,5.875042 8.48604,7.0227247 8.1067793,8.5597879 7.8410265,9.6368274 8.0329903,10.787029 8.6317551,11.705317 c 0.5717674,0.876885 1.4205679,1.474277 2.4457369,1.721329 0.47704,0.114961 1.079877,0.134602 1.585872,0.05167 z' id='path1432' /%3E%3C/svg%3E`,
    scale: 1,
    color,
  };
}
