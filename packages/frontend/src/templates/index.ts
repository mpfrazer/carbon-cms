import { registerTemplate } from "./registry";
import { article } from "./article";
import { recipe } from "./recipe";

// Built-in templates. Theme-contributed templates register at activation
// time (PR C); for now only built-ins exist.
registerTemplate(article);
registerTemplate(recipe);

export { article, recipe };
export {
  registerTemplate,
  getTemplate,
  listTemplates,
  type FrontendTemplate,
  type TemplatePost,
  type TemplateRenderProps,
} from "./registry";
