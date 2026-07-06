const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImageKit = require('imagekit');

// ─── ImageKit folder mapping by fieldname ─────────────────────────────────────
const getImageKitFolder = (fieldname, req) => {
  const f = fieldname;
  if (f === 'propertyImage' || f === 'propertyImages') return '/pleasant-homes/properties';
  if (f === 'galleryImages')                           return '/pleasant-homes/properties/gallery';
  if (f === 'roomImage'    || f === 'roomImages')      return '/pleasant-homes/rooms';
  if (f === 'profilePhoto')                            return '/pleasant-homes/tenants/profile';
  if (f === 'aadhaar'      || f === 'aadhaar_pdf')     return '/pleasant-homes/tenants/kyc/aadhaar';
  if (f === 'pan'          || f === 'pan_pdf')         return '/pleasant-homes/tenants/kyc/pan';
  if (f === 'id_card'      || f === 'id_card_pdf')     return '/pleasant-homes/tenants/kyc/idcard';
  if (f === 'agreement')                               return '/pleasant-homes/tenants/agreements';
  if (f === 'profileImage')                            return '/pleasant-homes/staff/profile';
  if (f === 'idProof') {
    return (req && req.baseUrl && req.baseUrl.includes('staff'))
      ? '/pleasant-homes/staff/idproof'
      : '/pleasant-homes/visitors/idproof';
  }
  if (f === 'attachments') return '/pleasant-homes/notices';
  if (f === 'photos')      return '/pleasant-homes/complaints';
  if (f === 'invoicePdf')  return '/pleasant-homes/invoices';
  return '/pleasant-homes/others';
};

// ─── Local disk fallback folder mapping ──────────────────────────────────────
const getLocalDestination = (fieldname, req) => {
  let subfolder = 'others';
  const f = fieldname;
  if (f === 'propertyImage' || f === 'propertyImages' || f === 'galleryImages') subfolder = 'properties';
  else if (f === 'roomImage' || f === 'roomImages') subfolder = 'rooms';
  else if (f === 'profilePhoto') subfolder = 'tenants/profile';
  else if (f === 'aadhaar' || f === 'aadhaar_pdf') subfolder = 'tenants/aadhaar';
  else if (f === 'pan'     || f === 'pan_pdf')      subfolder = 'tenants/pan';
  else if (f === 'id_card' || f === 'id_card_pdf')  subfolder = 'tenants/idcard';
  else if (f === 'agreement') subfolder = 'tenants/agreements';
  else if (f === 'profileImage') subfolder = 'staff/profile';
  else if (f === 'idProof') {
    subfolder = (req && req.baseUrl && req.baseUrl.includes('staff')) ? 'staff/idproof' : 'visitors';
  }
  else if (f === 'attachments') subfolder = 'notices';
  else if (f === 'photos')      subfolder = 'complaints';
  else if (f === 'invoicePdf')  subfolder = 'invoices';

  const dir = path.join(__dirname, '../uploads', subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// ─── Build storage engine ─────────────────────────────────────────────────────
let storage;

const imagekitInstance = (
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_PUBLIC_KEY  &&
  process.env.IMAGEKIT_URL_ENDPOINT
) ? new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
}) : null;

function saveToLocalDisk(buffer, file, req, cb) {
  try {
    const ext = path.extname(file.originalname) || '';
    const localDir = getLocalDestination(file.fieldname, req);
    const localName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const localPath = path.join(localDir, localName);
    fs.writeFileSync(localPath, buffer);
    
    // Construct relative path URL
    const subfolder = localDir.split(path.sep).slice(-2).join('/');
    const relativeUrl = `/uploads/${subfolder}/${localName}`;
    
    file.path = relativeUrl;
    console.log('✅ Uploaded successfully to Local Disk:', relativeUrl);
    return cb(null, { path: relativeUrl, size: buffer.length });
  } catch (fallbackErr) {
    console.error('[Fallback local storage writing failed]', fallbackErr);
    return cb(fallbackErr);
  }
}

storage = {
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data',  chunk => chunks.push(chunk));
    file.stream.on('error', err   => cb(err));
    file.stream.on('end',   async () => {
      const buffer  = Buffer.concat(chunks);
      const ext     = path.extname(file.originalname) || '';
      const safeName = `${file.fieldname}-${Date.now()}${ext}`;

      const isPdf = file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));

      if (isPdf) {
        // 1. PDF -> Supabase Upload
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            const supabase = require('../config/supabase');
            const { data, error } = await supabase.storage
              .from('kyc-documents')
              .upload(safeName, buffer, {
                contentType: file.mimetype,
                upsert: true
              });

            if (error) throw error;

            const { data: urlData } = supabase.storage
              .from('kyc-documents')
              .getPublicUrl(safeName);

            if (urlData && urlData.publicUrl) {
              file.path = urlData.publicUrl;
              console.log('✅ PDF uploaded successfully to Supabase Storage:', urlData.publicUrl);
              return cb(null, { path: urlData.publicUrl, size: buffer.length });
            }
          }
        } catch (supabaseErr) {
          console.warn('[Supabase Storage upload failed for PDF, trying ImageKit fallback]', supabaseErr.message);
        }

        // ImageKit Fallback for PDF
        if (imagekitInstance) {
          const folder = getImageKitFolder(file.fieldname, req);
          imagekitInstance.upload(
            {
              file:     buffer,
              fileName: safeName,
              folder:   folder,
              useUniqueFileName: true
            },
            (err, result) => {
              if (err) {
                console.warn('[ImageKit upload error for PDF, falling back to local disk storage]', err);
                return saveToLocalDisk(buffer, file, req, cb);
              }
              file.path = result.url;
              file.fileId = result.fileId;
              return cb(null, { path: result.url, size: result.size, fileId: result.fileId });
            }
          );
        } else {
          return saveToLocalDisk(buffer, file, req, cb);
        }
      } else {
        // 2. Photo/Image -> ImageKit Upload
        if (imagekitInstance) {
          const folder = getImageKitFolder(file.fieldname, req);
          imagekitInstance.upload(
            {
              file:     buffer,
              fileName: safeName,
              folder:   folder,
              useUniqueFileName: true
            },
            async (err, result) => {
              if (err) {
                console.warn('[ImageKit upload error for Photo, trying Supabase fallback]', err);
                // Try Supabase upload as fallback
                try {
                  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
                    const supabase = require('../config/supabase');
                    const { data, error } = await supabase.storage
                      .from('kyc-documents')
                      .upload(safeName, buffer, {
                        contentType: file.mimetype,
                        upsert: true
                      });

                    if (!error) {
                      const { data: urlData } = supabase.storage
                        .from('kyc-documents')
                        .getPublicUrl(safeName);

                      if (urlData && urlData.publicUrl) {
                        file.path = urlData.publicUrl;
                        console.log('✅ Photo uploaded successfully to Supabase Storage fallback:', urlData.publicUrl);
                        return cb(null, { path: urlData.publicUrl, size: buffer.length });
                      }
                    }
                  }
                } catch (supabaseErr) {
                  console.warn('[Supabase fallback failed for Photo]', supabaseErr.message);
                }
                return saveToLocalDisk(buffer, file, req, cb);
              }
              file.path = result.url;
              file.fileId = result.fileId;
              return cb(null, { path: result.url, size: result.size, fileId: result.fileId });
            }
          );
        } else {
          // Try Supabase first if ImageKit is not configured
          try {
            if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
              const supabase = require('../config/supabase');
              const { data, error } = await supabase.storage
                .from('kyc-documents')
                .upload(safeName, buffer, {
                  contentType: file.mimetype,
                  upsert: true
                });

              if (!error) {
                const { data: urlData } = supabase.storage
                  .from('kyc-documents')
                  .getPublicUrl(safeName);

                if (urlData && urlData.publicUrl) {
                  file.path = urlData.publicUrl;
                  console.log('✅ Photo uploaded successfully to Supabase Storage (no ImageKit):', urlData.publicUrl);
                  return cb(null, { path: urlData.publicUrl, size: buffer.length });
                }
              }
            }
          } catch (supabaseErr) {
            console.warn('[Supabase upload failed for Photo]', supabaseErr.message);
          }
          return saveToLocalDisk(buffer, file, req, cb);
        }
      }
    });
  },

  _removeFile(req, file, cb) {
    cb(null);
  }
};

console.log('✅ Multer → Multi-Tier Storage Engine initialized (Supabase -> ImageKit -> Local Disk).');

// ─── Export configured multer instance ───────────────────────────────────────
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },  // 20 MB max per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|avif/i;
    const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`), false);
    }
  }
});

module.exports = upload;
