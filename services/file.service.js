const fs = require("fs");
const path = require("path");
const { NotFoundError } = require("../src/errors");
const mkdir = require("mkdirp").sync;
const mime = require("mime-types");
const AWS  = require("aws-sdk");
const { Readable } = require('stream');
const { PutObjectCommand, S3Client, ListObjectsV2Command, GetObjectCommand, ListObjectsCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;

const clienteS3 = new S3Client({ region: REGION, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } });

const uploadDir = path.join(__dirname, "__uploads");
mkdir(uploadDir);

const uploadParams = (data, idP, type, idF, name, length) => ({
  Bucket: BUCKET_NAME,
  Key: `${idP}/${type}/${idF}/${name}`,
  // ContentType: 'image/jpg',
  Body: data,
  // ContentLength: 470646,
  ContentLength: Number(length),
  // ACL: 'public-read',
  });

const bucketParams = {
  Bucket: BUCKET_NAME,
  // Specify the name of the new object. For example, 'index.html'.
  // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
  Key: '1/registro/1/36d4ede86df60e284122f496be1bfee1.jpg',
  // Key: `${BUCKET_NAME}/1/registro/1/`,
  // Content of the new object.
  // Body: 'string aqui',
}

module.exports = {
	name: "file",
	actions: {
		get: {
			async handler(ctx) {
				// const filePath = path.join(uploadDir, 'alergias.csv');
				// if (!fs.existsSync(filePath))
				// 	return new NotFoundError();

				// ctx.meta.$responseType = mime.lookup(ctx.params.file);
				// // Return as stream
				// return fs.createReadStream(filePath);
        
        //const data = await clienteS3.send(new GetObjectCommand(bucketParams));
        const lsd = await clienteS3.send(new ListObjectsCommand({ Bucket: BUCKET_NAME }));
        // const lsd = await clienteS3.send(new ListObjectsCommand({ Bucket: BUCKET_NAME, Prefix: '1/registro/1/' }));
        console.log(lsd);
        const signedURL = await getSignedUrl(clienteS3, new GetObjectCommand(bucketParams), { expiresIn: 3600 });
        console.log(signedURL);
        console.log('++++++++++++++++++++++');
        return { code: 200, url: signedURL, bucketParams, listOfFiles: lsd.Contents };
			}
		},

		save: {
			async handler(ctx) {
				// this.logger.info("Received upload $params:", ctx.meta.$params);
        // console.log(ctx.params);
        // let buff = [];
        // let len = 0;
        // await ctx.params.on('data', (chunk) => {
        //   buff.push(chunk);
        //   len += chunk.length;
        //   // console.log('ne chunk', chunk);
        // });
        // console.log(uploadParams(buff));
        console.log('------------------------');
        console.log(ctx.meta.$multipart);
        const lsd = await clienteS3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME }));
        console.log(lsd);
        console.log('----------------------------------');
        try {
          // console.log(uploadParams(ctx.params));
          // const url = await clienteS3.send(new PutObjectCommand(uploadParams(ctx.params)));
          // const url = await clienteS3.send(new PutObjectCommand(uploadParams(buff)));
          // const stream = await Readable.from(buff);
          // console.log('.................');
          // console.log(stream);
          // console.log(uploadParams(stream));
          // console.log(buff.length);
          // console.log(lll);
          // console.log('.................');
          const idMedico = ctx.meta.$multipart.idMedico;
          const idPaciente = ctx.meta.$multipart.idPaciente;
          const nombre = ctx.meta.$multipart.nombre;
          const peso = ctx.meta.$multipart.peso;
          const registro = ctx.meta.$multipart.registro;
          console.log('-----------------------');
          console.log(idMedico);
          console.log(idPaciente);
          console.log(nombre);
          console.log(peso);
          console.log(registro);
          console.log('-----------------------');
          const url = await clienteS3.send(new PutObjectCommand(uploadParams(ctx.params, idPaciente, registro, 5, nombre, peso)));
          // const url = await clienteS3.send(new PutObjectCommand(uploadParams(stream, 1, 'registro', 1, ctx.meta.filename, len)));
          // const url = await clienteS3.send(new PutObjectCommand(bucketParams));
          console.log(url);
        } catch (e) {
          console.log('error');
          console.log(e);
        }
        console.log(typeof ctx.params);
        console.log('Y');
				return new this.Promise((resolve, reject) => {
					//reject(new Error("Disk out of space"));
					const filePath = path.join(uploadDir, ctx.meta.filename || this.randomName());
					const f = fs.createWriteStream(filePath);
					f.on("close", () => {
						// File written successfully
						this.logger.info(`Uploaded file stored in '${filePath}'`);
            // here s3 file upload
            this.logger.info(`uploaded by ${ctx.meta.$multipart.userr}`);
						resolve({ filePath, meta: ctx.meta });
					});
					ctx.params.on("error", err => {
						this.logger.info("File error received", err.message);
						reject(err);

						// Destroy the local file
						f.destroy(err);
					});

					f.on("error", () => {
						// Remove the errored file.
						fs.unlinkSync(filePath);
					});

					ctx.params.pipe(f);
				});
			}
		},

    delete: {
      async handler(ctx) {
				// const filePath = path.join(uploadDir, 'alergias.csv');
				// if (!fs.existsSync(filePath))
				// 	return new NotFoundError();

				// ctx.meta.$responseType = mime.lookup(ctx.params.file);
				// // Return as stream
				// return fs.createReadStream(filePath);
        
        //const data = await clienteS3.send(new GetObjectCommand(bucketParams));        
        const data = await clienteS3.send(new DeleteObjectCommand(bucketParams));
        console.log(data);
        console.log('++++++++++++++++++++++');
        const lsd = await clienteS3.send(new ListObjectsCommand({ Bucket: BUCKET_NAME }));
        console.log(lsd);
        return { code: 200, url: 'signedURL', listOfFiles: lsd };
			}
    },
	},
	methods: {
		randomName() {
			return "unnamed_" + Date.now() + ".png";
		}
	}
};