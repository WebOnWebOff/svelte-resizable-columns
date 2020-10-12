import postcssrc from 'postcss-load-config';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import { writeFileSync } from 'fs';
import { createFilter } from 'rollup-pluginutils';

import filename from './utils/filename';

export default (options = {}) => {
  let { include, exclude, ctx } = options;

  if (!include) include = '**/*.css';

  const filter = createFilter(include, exclude);

  return {
    name: 'css',

    async transform(source, id) {
      if (!filter(id)) return;

      const { plugins, options } = await postcssrc(ctx);
      let { css, map } = await postcss([postcssImport(), ...plugins]).process(source, {
        ...options,
        from: id,
        map: {
          inline: false,
        },
      });

      css = css.replace(/^\/\*#.*\/$/gm, `/*# sourceMappingURL=${filename(id)}.css.map */`);

      writeFileSync(`public/${filename(id)}.css`, css, () => true);
      writeFileSync(`public/${filename(id)}.css.map`, map.toString(), () => true);

      return {
        code: '',
        map: null,
      };
    },
  };
};
