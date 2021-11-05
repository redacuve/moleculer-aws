const fs = require("fs");
const path = require("path");
const { NotFoundError } = require("../src/errors");
const mkdir = require("mkdirp").sync;
const mime = require("mime-types");

const uploadDir = path.join(__dirname, "__uploads");
mkdir(uploadDir);

module.exports = {
	name: "file",
	actions: {
		get: {
			handler(ctx) {
				const filePath = path.join(uploadDir, ctx.params.file);
				if (!fs.existsSync(filePath))
					return new NotFoundError();

				ctx.meta.$responseType = mime.lookup(ctx.params.file);
				// Return as stream
				return fs.createReadStream(filePath);
			}
		},

		save: {
			handler(ctx) {
				this.logger.info("Received upload $params:", ctx.meta.$params);
				return new this.Promise((resolve, reject) => {
					//reject(new Error("Disk out of space"));
					const filePath = path.join(uploadDir, ctx.meta.filename || this.randomName());
					const f = fs.createWriteStream(filePath);
					f.on("close", () => {
						// File written successfully
						this.logger.info(`Uploaded file stored in '${filePath}'`);
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
		}
	},
	methods: {
		randomName() {
			return "unnamed_" + Date.now() + ".png";
		}
	}
};