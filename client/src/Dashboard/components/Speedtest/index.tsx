import React, { useEffect, useState, useContext, useCallback } from 'react';
import flow from 'lodash/flow';
import { Play as PlayIcon } from 'react-feather';

import { socketContext } from 'shared/Socket';
import { ToasterContext } from 'Toaster';
import { round, mbyte } from 'shared/utils/math';
import useApi from 'shared/hooks/useApi';
import Button from 'shared/components/Button';
import ValueTile from 'Dashboard/components/ValueTile';
import { Status, ProgressBar, ProgressBarWrapper, Values } from './style';
import { SpeedtestResult } from 'models/speedtest';
import { resultsContext } from 'Dashboard/ResultsContext';

const roundedMbit = flow([mbyte, (v) => v * 8, round]);

const Speedtest = () => {
	const { sendToast } = useContext(ToasterContext);
	const { socket } = useContext(socketContext);
	const [showStats, setShowStats] = useState(false);
	const [progress, setProgress] = useState(0);
	const [download, setDownload] = useState(0);
	const [upload, setUpload] = useState(0);
	const [ping, setPing] = useState(0);
	const { state, request: runSpeedtest } = useApi<SpeedtestResult>('/speedtest', 'post');
	const { setResults } = useContext(resultsContext);

	const handleEvent = useCallback(
		(eventData) => {
			switch (eventData.type) {
				case 'ping':
					setPing(eventData.ping.latency);
					setProgress(eventData.progress);
					if (!showStats) setShowStats(true);
					break;
				case 'download':
					setDownload(eventData.download.bandwidth);
					setProgress(eventData.progress);
					if (!showStats) setShowStats(true);
					break;
				case 'upload':
					setUpload(eventData.upload.bandwidth);
					setProgress(eventData.progress);
					if (!showStats) setShowStats(true);
					break;
				default:
					break;
			}
		},
		[showStats]
	);

	const handleRunSpeedtest = async () => {
		sendToast('Speedtest is starting');
		try {
			setShowStats(true);
			await runSpeedtest();
			// todo: add new result to results
			sendToast('Speedtest completed');
		} catch (e) {
			sendToast('Error running speedtest');
		}
	};

	useEffect(() => {
		socket.on('speedtest-progress-event', handleEvent);
		return () => {
			socket.removeEventListener('speedtest-progress-event', handleEvent);
		};
	}, [socket, handleEvent]);

	return (
		<div>
			<Button
				onClick={handleRunSpeedtest}
				icon={<PlayIcon size={14} />}
				isWorking={state.isLoading}
			>
				Run Speedtest Now
			</Button>
			<Status show={showStats}>
				<ProgressBarWrapper>
					<ProgressBar style={{ width: `${progress * 100}%` }} />
				</ProgressBarWrapper>
				<Values>
					<ValueTile title="Ping" unit="ms" value={round(ping)} />
					<ValueTile title="Download" unit="mbit" value={roundedMbit(download)} />
					<ValueTile title="Upload" unit="mbit" value={roundedMbit(upload)} />
				</Values>
			</Status>
		</div>
	);
};

export default Speedtest;