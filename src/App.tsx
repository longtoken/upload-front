import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';
import { Button, Progress, message } from 'antd';
import { axiosList } from 'utils/common';
import { getFileMd5, createFileChunk, FileBlob } from 'utils/fileProperty';
import { getFileChunks, uploadChunks } from 'utils/fileRequest';
import './App.scss';
import 'antd/dist/antd.less';

interface AppProps {}
interface AppState {
    scanPercent: number;
    uploadPercent: number;
    startScan: boolean;
}

export interface Chunk {
    chunk: Blob;
    fileHash: string;
    md5AndFileNo: string;
    percentage: number;
}

class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            scanPercent: 0,
            uploadPercent: 0,
            startScan: false,
        };
    }
    chunkListInfo: Chunk[] = [];
    fileName: string = '';
    fileMd5Value: string = '';
    fileChunkList: FileBlob[] = [];
    getFileMd5 = getFileMd5;
    uploadChunks = uploadChunks;
    handleUploaded(fileExist: boolean): boolean {
        if (fileExist) {
            this.setState({ uploadPercent: 100 });
            return false;
        } else {
            this.chunkListInfo = this.fileChunkList.map(({ file }, index) => ({
                fileHash: this.fileMd5Value,
                md5AndFileNo: `${this.fileMd5Value}-${index}`,
                chunk: file,
                percentage: 0,
            }));
            return true;
        }
    }
    async inputChange(event: React.ChangeEvent<HTMLInputElement>) {
        let target = event.target;
        let file = target.files && target.files[0];
        if (file) {
            this.setState({ startScan: true }); // 显示扫描开始
            this.fileName = file.name; // 文件名
            this.fileChunkList = createFileChunk(file); // 将文件切割成若然分
            this.fileMd5Value = await this.getFileMd5(this.fileChunkList); // 获取上传文件的md5值
            this.startUpload(); // 上传文件
        }
    }
    handlePause() {
        if (axiosList.length !== 0) {
            axiosList.forEach((item) => item.cancel('abort'));
            axiosList.length = 0;
            message.error('上传暂停');
        }
    }
    handleReuse() {
        this.startUpload();
    }
    async startUpload() {
        let uploadedFileInfo = await getFileChunks(this.fileName, this.fileMd5Value); // 获取上传文件信息
        if (this.handleUploaded(uploadedFileInfo.fileExist) && uploadedFileInfo.chunkList) {
            this.uploadChunks(this.chunkListInfo, uploadedFileInfo.chunkList, this.fileName);
        }
    }
    render() {
        let { scanPercent, uploadPercent, startScan } = this.state;
        return (
            <div className="app">
                <div className="my-upload">
                    <input
                        type="file"
                        name="file"
                        id="upload_file"
                        onChange={this.inputChange.bind(this)}
                    ></input>
                </div>
                <Button type="primary" className="pause" onClick={this.handlePause.bind(this)}>
                    上传pause
                </Button>
                &nbsp;
                <Button type="primary" className="start" onClick={this.handleReuse.bind(this)}>
                    上传resume
                </Button>
                {startScan && <div>{scanPercent === 100 ? '文件扫描完成' : '文件扫描中'}</div>}
                {scanPercent === 100 &&
                    (uploadPercent === 100 ? <div>文件上传成功</div> : <div>文件上传中</div>)}
                <Progress type="circle" percent={scanPercent} />
                <Progress type="circle" percent={uploadPercent} />
            </div>
        );
    }
}
export default hot(App);
