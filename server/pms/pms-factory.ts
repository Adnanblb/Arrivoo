import type { IPmsConnector, PmsConfig } from "./types";
import { OperaCloudConnector } from "./connectors/opera-cloud";
import { ProtelConnector } from "./connectors/protel";
import { CloudbedsConnector } from "./connectors/cloudbeds";

// Factory to create the appropriate PMS connector
export class PmsFactory {
  static createConnector(config: PmsConfig): IPmsConnector {
    const { pmsType, apiEndpoint, credentials } = config;

    switch (pmsType.toLowerCase()) {
      case "opera_cloud":
      case "opera":
        return new OperaCloudConnector(apiEndpoint, credentials);
      
      case "protel":
        return new ProtelConnector(apiEndpoint, credentials);
      
      case "cloudbeds":
        return new CloudbedsConnector(apiEndpoint, credentials);
      
      default:
        // Default to Opera Cloud for backward compatibility
        return new OperaCloudConnector(apiEndpoint, credentials);
    }
  }

  static getSupportedPmsTypes(): string[] {
    return ["opera_cloud", "protel", "cloudbeds"];
  }
}
