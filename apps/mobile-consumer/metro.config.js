// إعداد Metro لمشروع داخل npm workspaces (monorepo) — بدون هذا الإعداد يمكن أن
// يحلّ Metro حزمة "react" من أكثر من مسار (محلي + جذر الـ monorepo) فيسبب
// خطأ "Invalid hook call" الناتج عن وجود نسختين من React في نفس الحزمة.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// يمنع Metro من الصعود فوق القائمة أعلاه بحثاً عن node_modules بترتيب مختلف،
// فيضمن حلّ "react" ونظرائها لنسخة واحدة ثابتة دائماً.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
