// Execute the actual TypeScript numerical model, bundled for Node by esbuild.
const {buildSync}=require('esbuild');
const Module=require('node:module');
const path=require('node:path');
module.exports=function(name){
 const filename=path.resolve(__dirname,'../demos/src',name==='lib'?'lib/math.ts':name+'/math.ts');
 const source=buildSync({entryPoints:[filename],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(source,filename);return mod.exports;
};
