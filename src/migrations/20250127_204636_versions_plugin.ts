import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
  // Queda comentado por no necesitarlo ahora
  // console.log('Updating all entradas to published');
  // const res = await payload.update({ 
  //   collection: 'entradas',
  //   where: {
  //     _status: {
  //       exists: {equals: false},
  //     },
  //   },
  //   depth: 0,
  //   data: {
  //     _status: 'published', 
  //   },
  //   context: {
  //     // set a flag to prevent extra
  //     skipHooks: true,
  //   },
  // });
  // console.log(res);
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Migration code
};
