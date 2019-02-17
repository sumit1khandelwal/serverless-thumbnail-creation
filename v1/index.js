var AWS = require("aws-sdk");
var async = require("async");

var THUMBNAIL = {
        'metadata': 'thumbnails',
        'prefix': 'thumbnails/',
        'width': 75,
        'height': 75
    },
    HEADSHOT = {
        'metadata': 'headshots',
        'prefix': 'headshots/',
        'width': 375,
        'height': 500
    },
    ALLOWED_FILETYPES = ['png', 'jpg', 'JPG', 'jpeg', 'JPEG', 'bmp', 'tiff', 'pdf', 'gif'];

var utils = {
    decodeKey: function(key) {
        return decodeURIComponent(key).replace(/\+/g, ' ');
    }
};

exports.handler = function(event, context) {

    var eventName = event.Records[0].eventName;

    console.log(eventName);

    if (eventName === 'ObjectCreated:Put') {
        TriggerPutEvent(event, context);
    }
    if (eventName.indexOf('ObjectRemoved') > -1) {
        TriggerDeleteEvent(event, context);
    }
};

function TriggerDeleteEvent(event, context) {
    var srcKey = utils.decodeKey(event.Records[0].s3.object.key);
    var bucket = event.Records[0].s3.bucket.name;

    if (srcKey.indexOf(THUMBNAIL.prefix) >= 0) {
        return;
    }
    if (srcKey.indexOf(HEADSHOT.prefix) >= 0) {
        return;
    }

    var ids = srcKey.split('/')
    var fileName = ids[ids.length - 1];
    var dstKey1 = ids[0] + '/' + THUMBNAIL.prefix + THUMBNAIL.width + '*' + THUMBNAIL.height + '/' + ids[ids.length - 1];
    var dstKey2 = ids[0] + '/' + HEADSHOT.prefix + HEADSHOT.width + '*' + HEADSHOT.height + '/' + ids[ids.length - 1];


    var objects = [];
    objects.push({ Key: dstKey1 });
    objects.push({ Key: dstKey2 });
    var options = {
        Bucket: bucket,
        Delete: {
            Objects: objects
        }
    };
    console.log(JSON.stringify(options));
    var s3 = new AWS.S3();
    s3.deleteObjects(options, function(err, data) {
        if (data) {
            console.log("File successfully deleted");
        } else {
            console.log("Check with error message " + err);
        }
    });
}

function TriggerPutEvent(event, context) {
    var srcKey = utils.decodeKey(event.Records[0].s3.object.key);
    var bucket = event.Records[0].s3.bucket.name;

    if (srcKey.indexOf(THUMBNAIL.prefix) >= 0) {
        return;
    }
    if (srcKey.indexOf(HEADSHOT.prefix) >= 0) {
        return;
    }
    async.series([
            function(callback) {
                console.log('First Step --> ');
                ImageAlter(THUMBNAIL, srcKey, bucket, context);
                callback(null, '1');
            },
            function(callback) {
                console.log('Second Step --> ');
                ImageAlter(HEADSHOT, srcKey, bucket, context);
                callback(null, '2');
            }
        ],
        function(err, result) {
            console.log(result);
        });
}


function ImageAlter(imageObject, srcKey, bucket, context) {

    var fileType = srcKey.match(/\.\w+$/);
    var mktemp = require("mktemp");

    if (srcKey.indexOf(THUMBNAIL.prefix) >= 0) {
        return;
    }
    if (srcKey.indexOf(HEADSHOT.prefix) >= 0) {
        return;
    }

    if (fileType === null) {
        console.error("Invalid filetype found for key: " + srcKey);
        return;
    }

    var ids = srcKey.split('/');
    var dstKey = ids[0] + '/' + imageObject.prefix + imageObject.width + '*' + imageObject.height + '/' + ids[ids.length - 1];

    fileType = fileType[0].substr(1);

    if (ALLOWED_FILETYPES.indexOf(fileType) === -1) {
        return;
    }

    var s3 = new AWS.S3();
    var fs = require("fs");
    var gm = require("gm").subClass({ imageMagick: true });

    s3.getObject({
        Bucket: bucket,
        Key: srcKey
    }, function(err, data) {
        if (err) {
            Error(err);
        } else createThumbnail(data);
    });

    function createThumbnail(response) {
        console.log("fsdfsfd");
        var temp_file, image;

        if (fileType === "pdf") {
            temp_file = mktemp.createFileSync("/tmp/XXXXXXXXXX.pdf")
            fs.writeFileSync(temp_file, response.Body);
            image = gm(temp_file + "[0]");
        } else if (fileType === 'gif') {
            temp_file = mktemp.createFileSync("/tmp/XXXXXXXXXX.gif")
            fs.writeFileSync(temp_file, response.Body);
            image = gm(temp_file + "[0]");
        } else {
            image = gm(response.Body);
        }
        console.log('image resize started...');

        image.size(function(err, size) {
            var scalingFactor = Math.min(1, imageObject.width / size.width, imageObject.height / size.height),
                width = scalingFactor * size.width,
                height = scalingFactor * size.height;
            console.log(width, height);
            this.setFormat('jpg')
                .resize(width, height)
                .gravity('Center')
                .stream(function(err, stdout, stderr) {
                    if (err) Error(err)
                    var chunks = [];
                    stdout.on('data', function(chunk) {
                        chunks.push(chunk);
                    });
                    stdout.on('end', function() {
                        var image = Buffer.concat(chunks);
                        uploadThumbnail(response.contentType, image);
                    });
                    stderr.on('data', function(data) {
                        console.log(`stderr ${size} data:`, data);
                    });
                });
        });
    };

    function uploadThumbnail(contentType, data) {
        var putObj = {
            Bucket: bucket,
            Key: dstKey,
            Body: data,
            ContentType: "image/jpg",
            ACL: 'public-read'
        };
        console.log("final data: " + JSON.stringify(putObj));
        s3.putObject(putObj, function(err, data) {
            if (err) {
                Error(err)
            } else {


            }
        });
    };

    function Error(err) {
        if (err) {
            console.error(
                "Unable to generate thumbnail for '" + bucket + "/" + srcKey + "'" +
                " due to error: " + err
            );
        } else {
            console.log("Created thumbnail for '" + bucket + "/" + srcKey + "'");
        }
        context.done();
    };
}