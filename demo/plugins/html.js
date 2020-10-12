import postcssrc from 'postcss-load-config';
import postcss from 'postcss';
import syntax from 'postcss-syntax';
import htmlnano from 'htmlnano';
import { createFilter } from 'rollup-pluginutils';
import { writeFileSync } from 'fs';

import filename from './utils/filename';

export default (options = {}) => {
  let { include, exclude, ctx } = options;

  if (!include) include = '**/*.html';

  const filter = createFilter(include, exclude);

  return {
    name: 'html',

    async transform(source, id) {
      if (!filter(id)) return;

      const { plugins, options } = await postcssrc(ctx);
      const { css } = await postcss(plugins).process(source, {
        ...options,
        syntax: syntax,
        from: id,
      });
      const { html } = await htmlnano.process(css, options);

      writeFileSync(`public/${filename(id)}.html`, ctx.production ? html : css, () => true);

      return {
        code: '',
        map: null,
      };
    },
  };
};
