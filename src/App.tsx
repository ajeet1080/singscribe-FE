import React, { useState, useRef } from "react";
import {
  Button,
  useToast,
  Box,
  Text,
  Textarea,
  VStack,
  HStack,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import axios from "axios";
import shslogo from "./assets/singhealth-logo.png";
import shsdividerlogo from "./assets/shs-divider.png";
import { css } from "@emotion/react";
import { JSX } from "react/jsx-runtime";
useColorModeValue;

const App: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>(""); // State for the summary text
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tempAudio = useRef<Blob | null>(null);
  const toast = useToast();
  const [apiResponseReceived, setApiResponseReceived] =
    useState<boolean>(false);
  const [isLoadingTranscript, setIsLoadingTranscript] =
    useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);

      // Display toast message for starting recording
      toast({
        title: "Recording has started",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error starting recording",
        description:
          "Failed to start recording. Please ensure your microphone is working.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        tempAudio.current = audioBlob;
        audioChunksRef.current = [];
        setRecording(false);
        setIsLoading(true);
        await transcribeAudio();
      };
    }
  };

  const transcribeAudio = async () => {
    if (tempAudio.current) {
      setIsLoading(true);
      setIsLoadingTranscript(true);
      setIsLoadingSummary(true);
      const formData = new FormData();
      formData.append("audio", tempAudio.current);

      try {
        const transcribeResponse = await axios.post(
          "https://transcribe003.azurewebsites.net/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const transcript = transcribeResponse.data.transcript;
        // setIsLoading(true);
        axios
          .post(
            "https://sgs-genai-omr-api.azurewebsites.net/format_transcript",
            { transcript },
            { headers: { "Content-Type": "application/json" } }
          )
          .then((formatResponse) => {
            setTranscript(formatResponse.data.content); // Update as per actual response structure
            setIsLoadingTranscript(false);
            //  setIsLoading(true);
          });

        axios
          .post(
            "https://sgs-genai-omr-api.azurewebsites.net/summarize_transript",
            { transcript },
            { headers: { "Content-Type": "application/json" } }
          )
          .then((summarizeResponse) => {
            setSummary(summarizeResponse.data.content); // Update as per actual response structure
            setIsLoadingSummary(false);
            // setIsLoading(true);
          });
      } catch (error) {
        toast({
          title: "Error transcribing audio",
          description:
            "An error occurred while transcribing the audio." + error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        // setIsLoading(true);
        setApiResponseReceived(true);
      }
    }
  };

  const customTabStyles = css`
    .chakra-tabs__tab {
      color: #e54809; /* Change to your preferred shade of orange */
    }
  `;
  const bgColorDoctor = useColorModeValue("blue.100", "blue.700");
  const bgColorPatient = useColorModeValue("green.100", "green.700");
  const parseTranscript = (transcript: string) => {
    let previousSpeaker = "";
    let dialogue = "";
    const transcriptComponents: JSX.Element[] = [];

    transcript.split("\n").forEach((line, index) => {
      const isPatient = line.startsWith("Patient:");
      const isDoc = line.startsWith("Doctor:");
      const speaker = isDoc ? "Doctor" : "Patient";

      if (speaker !== previousSpeaker && dialogue) {
        transcriptComponents.push(
          <Box key={index} p={3} borderRadius="md" w="full" boxShadow="md">
            <Badge
              colorScheme={previousSpeaker === "Doctor" ? "orange" : "red"}
              fontSize="0.em"
              mr={9}
            >
              {previousSpeaker}
            </Badge>
            <Text
              as={previousSpeaker === "Patient" ? "" : "span"}
              display="inline"
            >
              {dialogue}
            </Text>
          </Box>
        );
        dialogue = "";
      }

      dialogue += " " + line.substring(speaker.length + 1);
      previousSpeaker = speaker;
    });

    return transcriptComponents;
  };

  return (
    <VStack spacing={4} p={4}>
      <Box align="center">
        <img src={shslogo} alt="SingHealth Logo" width={225} height={125} />
        <Text fontSize="4xl" fontWeight="bold" color="#E54809" align="center">
          SingScribe
        </Text>
        <Text fontSize="xl" fontWeight="normal" color="black" align="center">
          Voice to Text Transcription and summarization
        </Text>
        <img
          src={shsdividerlogo}
          alt="SingHealth Divider"
          width="1000px"
          height="10px"
        />
      </Box>
      <Button
        colorScheme={recording ? "blue" : "orange"}
        onClick={toggleRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
      {isLoading && (
        <HStack spacing={4} width="100%">
          <Box
            flex="1"
            width="100%"
            height={500}
            p={3}
            overflow="auto"
            borderRadius="md"
          >
            <Text fontSize="2xl" fontWeight="bold">
              Transcript
            </Text>
            {isLoadingTranscript ? (
              <Spinner size="xl" color="#E54809" />
            ) : (
              parseTranscript(transcript)
            )}
          </Box>
          <Box flex="1" width="100%" height={500} p={3} borderRadius="md">
            <Text fontSize="2xl" fontWeight="bold">
              Summary
            </Text>
            {isLoadingSummary ? (
              <Spinner size="xl" color="#E54809" />
            ) : (
              <Textarea
                width="100%"
                height={450}
                p={3}
                borderRadius="md"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            )}
          </Box>
        </HStack>
      )}
    </VStack>
  );
};

export default App;
