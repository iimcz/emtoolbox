import { ExhibitProperties, PackageOverlayProperties, PackageProperties } from "src/app/services/api.generated.service";

export class DeviceEventInfo {
    device?: ExhibitProperties;
    package?: PackageProperties;
    overlay?: PackageOverlayProperties;
}