import Axios, { CancelTokenSource } from 'axios';
import { checkChunkPath, uploadChunkPath, mergeChunkPath } from 'utils/requestPath';
import { Chunk } from '../App';
import { Component } from 'react';
import { axiosList } from 'utils/common';
import { message } from 'antd';

const CancelToken = Axios.CancelToken;

interface FileStatus {
    fileExist: boolean;
    chunkList?: string[];
    desc: string;
}

export function getFileChunks(fileName: string, fileMd5Val: string): Promise<FileStatus> {
    return new Promise((resolve, reject) => {
        Axios.get(checkChunkPath, {
            params: {
                fileName,
                fileMd5Val,
            },
        })
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                console.log(error, '--catch--');
                message.error('网络连接失败');
                reject({ message: '错误' });
            });
    });
}

export async function uploadChunks(
    this: Component,
    chunkListInfo: Chunk[],
    uploadedList: string[],
    fileName: string,
) {
    const requestList = chunkListInfo
        .filter(({ md5AndFileNo }) => !uploadedList.includes(md5AndFileNo))
        .map(({ chunk, md5AndFileNo, fileHash }) => {
            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('md5AndFileNo', md5AndFileNo);
            formData.append('fileName', fileName);
            formData.append('fileHash', fileHash);
            return formData;
        });
    if (requestList.length === 0) {
        mergeRequest(chunkListInfo[0].fileHash, fileName);
    } else {
        sendRequest(requestList, (percent: number) => {
            this.setState({ uploadPercent: percent });
        }).then(() => {
            if (uploadedList.length + requestList.length === chunkListInfo.length) {
                mergeRequest(chunkListInfo[0].fileHash, fileName);
            }
        });
    }
}

function sendRequest(
    requestList: FormData[],
    setUploadProgress: (percent: number) => void,
    upMaxCount: number = 4,
) {
    return new Promise((resolve) => {
        let uploadedTotal = requestList.length;
        let sendCout = 0;
        let uploadedCount = 0;
        const sendPacks = () => {
            while (sendCout < uploadedTotal && upMaxCount > 0) {
                const formData = requestList[sendCout];
                upMaxCount--;
                sendCout++;

                const source = CancelToken.source();

                Axios.post(uploadChunkPath, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    cancelToken: source.token,
                }).then(() => {
                    rmUploadedRequest(source);

                    upMaxCount++;
                    uploadedCount++;

                    setUploadProgress(Math.round((uploadedCount / uploadedTotal) * 100));

                    if (uploadedCount === uploadedTotal) {
                        resolve();
                    } else {
                        sendPacks();
                    }
                });
                axiosList.push(source);
            }
        };
        sendPacks();
    });
}

function rmUploadedRequest(source: CancelTokenSource) {
    axiosList.forEach((item, index) => {
        if (item.token === source.token) {
            axiosList.splice(index, 1);
        }
    });
}

export function mergeRequest(targetFile: string, fileName: string) {
    Axios.get(mergeChunkPath, {
        params: {
            fileHash: targetFile,
            fileName,
        },
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error, '--catch');
        });
}
