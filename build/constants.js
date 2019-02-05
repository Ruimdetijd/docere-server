"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WIKIDATA_URL = 'https://www.wikidata.org/w/api.php';
exports.WIKIMEDIA_URL = 'https://commons.wikimedia.org/w/api.php';
var HttpCode;
(function (HttpCode) {
    HttpCode[HttpCode["OK"] = 200] = "OK";
    HttpCode[HttpCode["NoContent"] = 204] = "NoContent";
    HttpCode[HttpCode["BadRequest"] = 400] = "BadRequest";
    HttpCode[HttpCode["NotFound"] = 404] = "NotFound";
    HttpCode[HttpCode["InternalServerError"] = 500] = "InternalServerError";
})(HttpCode = exports.HttpCode || (exports.HttpCode = {}));
