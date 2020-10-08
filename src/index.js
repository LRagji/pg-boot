"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgBoot = void 0;
var pg = __importStar(require("pg-promise"));
var crypto = __importStar(require("crypto"));
var PgBoot = /** @class */ (function () {
    function PgBoot(name) {
        this.version = -1;
        this.name = name;
        this.checkVersion = this.checkVersion.bind(this);
    }
    PgBoot.dynamicPreparedStatement = function (name, sql, dynamicValues) {
        var valueArray = Object.keys(dynamicValues).map(function (k) { return dynamicValues[k]; });
        var options = {
            name: crypto
                .createHash('md5')
                .update(name + '.' + valueArray.join('.'))
                .digest('hex'),
            text: pg.as.format(sql, dynamicValues),
        };
        return new pg.PreparedStatement(options);
    };
    PgBoot.prototype.checkVersion = function (pgWriterConnection, expectedSchemaVersion, reconcileCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var lockStatement, checkSchemaVersion, updateCreateSchemaVersion, versionFunctionExists;
            var _this = this;
            return __generator(this, function (_a) {
                if (expectedSchemaVersion === this.version)
                    return [2 /*return*/, Promise.resolve(true)];
                lockStatement = new pg.PreparedStatement({
                    name: 'TransactionLock',
                    text: 'SELECT pg_advisory_xact_lock(hashtext($1)) as "Locked";',
                    values: [this.name],
                });
                checkSchemaVersion = PgBoot.dynamicPreparedStatement('CheckSchemaVersion', 'SELECT $[name:name]() AS "version";', { name: this.name });
                updateCreateSchemaVersion = PgBoot.dynamicPreparedStatement('updateCreateSchemaVersion', 'CREATE OR REPLACE FUNCTION $[name:name]() RETURNS integer LANGUAGE SQL AS $$ SELECT $[version] $$;', { name: this.name, version: expectedSchemaVersion });
                versionFunctionExists = new pg.PreparedStatement({
                    name: 'VersionFunctionExists',
                    text: "SELECT EXISTS(\n            SELECT 1 \n            FROM pg_catalog.pg_proc p\n            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace \n            WHERE proname = $1 AND n.nspname::TEXT = $2)",
                });
                return [2 /*return*/, pgWriterConnection.tx(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                        var versionExists, existingVersion;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, transaction.one(lockStatement, [this.name])];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, transaction.one(versionFunctionExists, [this.name, pgWriterConnection.$config.options.schema])];
                                case 2:
                                    versionExists = _a.sent();
                                    if (!(versionExists.exists === true)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, transaction.one(checkSchemaVersion)];
                                case 3:
                                    existingVersion = _a.sent();
                                    this.version = existingVersion.version;
                                    if (existingVersion.version === expectedSchemaVersion) {
                                        return [2 /*return*/, Promise.resolve(true)];
                                    }
                                    _a.label = 4;
                                case 4: return [4 /*yield*/, reconcileCallback(transaction, this.version)];
                                case 5:
                                    _a.sent();
                                    return [4 /*yield*/, transaction.none(updateCreateSchemaVersion)];
                                case 6:
                                    _a.sent();
                                    this.version = expectedSchemaVersion;
                                    return [2 /*return*/, Promise.resolve(true)];
                            }
                        });
                    }); })];
            });
        });
    };
    return PgBoot;
}());
exports.PgBoot = PgBoot;
