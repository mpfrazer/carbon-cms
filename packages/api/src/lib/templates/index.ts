import { registerTemplate } from "./registry";
import { article } from "./article";

// Built-in templates. Theme-contributed templates register at activation
// time (PR C); for now only built-ins exist.
registerTemplate(article);

export { article };
export {
  registerTemplate,
  getTemplate,
  listTemplates,
  listTemplateKinds,
  validateStructuredData,
  type ApiTemplate,
} from "./registry";
