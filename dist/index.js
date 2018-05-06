'use strict';
/**
 * this resolver is used as a plugin of eslint-plugin-import
 * to solve npm package mapping problem
 *
 */
const path = require('path');
const coreModules = {};

require('./core').forEach(function (m) {
  this[m] = true
}, coreModules);

exports.interfaceVersion = 2;

const Module = module.constructor;
const toString = Object.prototype.toString;

exports.resolve = (modulePath, sourceFile, config) => {
  const isRelativePath = modulePath[0] === '.';
  if (!isRelativePath && coreModules[modulePath]) {
    return { found: true, path: null };
  }

  const sourceDir = path.dirname(sourceFile);
  let findPath;

  if (isRelativePath) {
    findPath = path.resolve(sourceDir, modulePath);
    return findModulePath(findPath, []);
  }

  /* istanbul ignore else */
  if (toString.call(config) === '[object Array]') {
    for (let i = 0, len = config.length; i < len; i++) {
      const re = new RegExp(`(^|/)${config[i][0]}($|/)`);
      const match = modulePath.match(re);
      if (match) {
        findPath = modulePath.replace(match[0], `${match[1]}${config[i][1]}${match[2]}`);
        break;
      }
    }
  }

  if (!findPath) {
    findPath = modulePath;
  }

  const paths = resolveLookupPaths(sourceDir);
  return findModulePath(findPath, paths);
};

function findModulePath(request, paths) {
  const filename = Module._findPath(request, paths);
  return {
    found: !!filename,
    path: filename || null
  };
}

function resolveLookupPaths(absoluteSourceDir) {
  const paths = [];
  let curDir;
  let nextDir = absoluteSourceDir;
  do {
    // not append node_modules to a path already ending with node_modules
    while(nextDir.indexOf('node_modules', nextDir.length - 12) !== -1) {
      nextDir = path.resolve(nextDir, '..');
    }
    curDir = nextDir;
    paths.push(path.resolve(curDir, 'node_modules'));
    nextDir = path.resolve(curDir, '..');
  } while(nextDir !== curDir);

  paths.push.apply(paths, Module.globalPaths);
  return paths;
}