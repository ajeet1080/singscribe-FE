import React, { useEffect, useState, useRef } from "react";

import {
  TextAnalyticsClient,
  AzureKeyCredential,
} from "@azure/ai-text-analytics";
import CryptoJS from "crypto-js";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  RadioGroup,
  Stack,
  Radio,
  Input,
  Checkbox,
  Select,
  Collapse,
  Heading,
} from "@chakra-ui/react";

import shslogo from "../assets/singhealth-logo.png";
import shsdividerlogo from "../assets/shs-divider.png";
import shsbackground from "../assets/SingScribe_Design.png";
import soundwave from "../assets/soundwave.gif";
import {
  ConversationTranscriber,
  SpeechConfig,
  AudioConfig,
} from "microsoft-cognitiveservices-speech-sdk";
import { CosmosClient } from "@azure/cosmos";
import prompt_general from "../prompts/general";
import prompt_end from "../prompts/end";
import prompt_uro from "../prompts/uro";
import clear_all from "../assets/clear_all.jpg";

useColorModeValue;

const UserRecording: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>(""); // State for the summary text
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const [isLoadingTranscript, setIsLoadingTranscript] =
    useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [formattedTranscript, setFormattedTranscript] = useState("");
  const [transcription, setTranscription] = useState<
    { speakerId: string; text: string }[]
  >([]);
  const [encryptedTranscript, setEncryptedTranscript] = useState("");
  const [conversationTranscriber, setConversationTranscriber] =
    useState<ConversationTranscriber | null>(null);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [language, setLanguage] = useState("en-SG");
  const [isOpen, setIsOpen] = useState(true);
  const onClose = () => setIsOpen(false);
  const [isEditing, setIsEditing] = useState(false); // State for the editing mode
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isGenerateLoading, setGenerateLoading] = useState<boolean>(false);

  const rawTranscriptRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [formattedText, setFormattedText] = useState<string>("");
  const [uCode, setUCode] = useState<string>("");
  const [userConsent, setUserConsent] = useState<boolean>(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [jwt, setJwt] = useState<string>("");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  const togglePrompt = () => {
    setShowPrompt(!showPrompt);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    if (languageSelected) {
      onClose();
    }
  }, [language]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setLanguageSelected(true);
  };
  const handleUserConsent = () => {
    setUserConsent(!userConsent);
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpeciality(event.target.value);

    let newPrompt = "";
    if (event.target.value === "END") {
      newPrompt = prompt_end;
    } else if (event.target.value === "URO") {
      newPrompt = prompt_uro;
    } else if (event.target.value === "GEN") {
      newPrompt = prompt_general;
    } else {
      newPrompt = "No prompt selected.";
    }
    setPrompt(newPrompt);
  };

  const handleClearAll = () => {
    setSummary("");
    setTranscription([]);
    setFormattedTranscript("");
    setEncryptedTranscript("");
    setGenerateLoading(false);
    setTimer(0);
    setUCode("");
  };

  const handleLogin = async () => {
    try {
      // Initialize Cosmos DB client
      const cosmosDBClient = new CosmosClient({
        endpoint: "https://singscribe-cosmosdb.documents.azure.com:443/",
        key: "SjcL1sPNRelpz9IyBzXL1Aww9smwQALhmPxGikKauJ8H0C1CzXQU3SZ09Scfyg85CxQcPrWNAmS8ACDb2jcm4Q==",
      });

      const databaseId = "notebuddy";
      const containerId = "users";

      // Get or create the database and container
      const { database } = await cosmosDBClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });

      // Query for the user document
      const querySpec = {
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [
          {
            name: "@username",
            value: userId, // Replace with the actual username
          },
        ],
      };

      const { resources: items } = await container.items
        .query(querySpec)
        .fetchAll();

      if (items.length > 0) {
        const user = items[0];
        if (user.password === password) {
          setIsAuthenticated(true);
        } else {
          toast({
            title: "Login failed",
            description: "Invalid password.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: "Login failed",
          description: "User not found.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error while authenticating:", error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const startRecording = async () => {
    try {
      const speechConfig = SpeechConfig.fromSubscription(
        "e5404bd89ea14c388c2c17234f95e36a",
        "southeastasia"
      );
      speechConfig.speechRecognitionLanguage = language;
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      const transcriber = new ConversationTranscriber(
        speechConfig,
        audioConfig
      );

      transcriber.transcribed = (
        s: any,
        e: { result: { text: string; speakerId: string } }
      ) => {
        setTranscription((prevTranscription) => [
          ...prevTranscription,
          { speakerId: e.result.speakerId, text: e.result.text },
        ]);
      };

      await transcriber.startTranscribingAsync();
      setConversationTranscriber(transcriber);
      setRecording(true);

      // Start the timer
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
      setTimerInterval(interval);
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

  // Function to save transcript and summary to Cosmos DB
  const saveToCosmosDB = async (summary: string, transcript: string) => {
    const cosmosClient = new CosmosClient({
      endpoint: "https://singscribe-cosmosdb.documents.azure.com:443/",
      key: "SjcL1sPNRelpz9IyBzXL1Aww9smwQALhmPxGikKauJ8H0C1CzXQU3SZ09Scfyg85CxQcPrWNAmS8ACDb2jcm4Q==",
    });

    const databaseId = "notebuddy";
    const containerId = "summaries";

    const generateUniqueCode = () => {
      // Implement your code generation logic here
      // For simplicity, we'll use a random number as an example

      setUCode(Math.random().toString(36).substr(2, 9));
      return uCode;
    };
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: databaseId,
    });
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
    });

    const querySpec = {
      query: "SELECT c.id FROM c",
    };

    const { resources: items } = await container.items
      .query(querySpec)
      .fetchAll();

    const ids = items.map((item) => Number(item.id));
    const maxId = Math.max(...ids);
    const newId = String(maxId + 1);
    setUCode(newId);

    // Save the data
    const { resource: createdItem } = await container.items.create({
      id: newId,
      user: userId,
      summary,
      transcript,
      updatedSummary: "",
    });

    // Return the new id
    //return newId;
  };

  const stopRecording = async () => {
    if (conversationTranscriber) {
      await conversationTranscriber.stopTranscribingAsync();
      setConversationTranscriber(null);
    }

    setRecording(false);
    setIsLoading(true);
    setIsLoadingSummary(true);
    setIsLoadingTranscript(true);
    await transcribeAudio();
    setGenerateLoading(true);
  };

  const handleGenerate = async () => {
    try {
      const uniqueCode = await saveToCosmosDB(summary, formattedTranscript);
      // Do something with the uniqueCode, like showing it to the user
      toast({
        title: "Data saved",
        description: `Your data has been saved with code: ${uniqueCode}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving to Cosmos DB:", error);
      toast({
        title: "Error saving data",
        description: "Failed to save data to Cosmos DB.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Your toBase64 function
  function toBase64(input: string) {
    const bytes = new TextEncoder().encode(input);
    let binString = "";
    for (let i = 0; i < bytes.length; i++) {
      binString += String.fromCodePoint(bytes[i]);
    }
    return btoa(binString);
  }

  const regererateSummary = async () => {
    setSummary("");
    setIsLoadingSummary(true);
    setSummaryText("");
    // get jwt token by calling get api https://tandem01.azurewebsites.net/api/gettoken . Output json has feild called token
    async function getJwtToken() {
      try {
        const response = await fetch(
          "https://tandem01.azurewebsites.net/api/gettoken",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.token;
      } catch (error) {
        console.error("Error:", error);
      }
    }

    const message =
      prompt +
      "\n*********************************************\n Refer below actual transcript:\n\n" +
      encryptedTranscript;

    const encodedMessage = toBase64(message);

    try {
      const jwt = await getJwtToken();
      const response = await fetch("/TandemApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          APIKey: "5eb165be933e4eb18b8882d40857266c",
          Authorization: `Bearer ${jwt}`,
          user: "sia.chen.han@synapxe.sg",
          Timestamp:
            new Date()
              .toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
              .replace(/\//g, "-") +
            " " +
            new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
        },
        body: JSON.stringify({
          userId: "notebudy@singhealth.com.sg",
          func_bypass: "",
          message: encodedMessage,
          chat_model: "gpt4",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let summary = ""; // Define summary here
        let lastResponse = ""; // Keep track of the last response

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const decodedChunk = decoder.decode(value);
          const lines = decodedChunk.split("\n");
          const nonEmptyLines = lines.filter(
            (line) => line !== "" && line !== "[DONE]"
          );
          const parsedLines = nonEmptyLines
            .filter((line) => {
              try {
                JSON.parse(line.replace(/^data: /, ""));
                return true;
              } catch {
                return false;
              }
            })
            .map((line) => JSON.parse(line.replace(/^data: /, "")));
          setIsLoadingSummary(false); // Update the loading state

          for (const parsedLine of parsedLines) {
            if (parsedLine.response && parsedLine.response !== lastResponse) {
              await new Promise((resolve) => setTimeout(resolve, 100));
              if (parsedLine.response.startsWith(lastResponse)) {
                // If the new response is a continuation of the last response, only append the new part
                summary += parsedLine.response.slice(lastResponse.length);
              } else {
                summary += parsedLine.response;
              }
              lastResponse = parsedLine.response; // Update the last response
              setSummaryText(summary);
              setSummary(summary); // Update the state at the end of processing
            }
          }
          setIsLoadingSummary(false);
        }

        // Update the loading state
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoadingSummary(false); // Update the loading state in case of error
    }
  };

  const transcribeAudio = async () => {
    const transcript = transcription
      .map((t) => `${t.speakerId}: ${t.text}`)
      .join("\n");
    // setIsLoading(true);
    setIsLoading(true);

    let encryptedText = transcript;

    setEncryptedTranscript(encryptedText);

    async function getJwtToken() {
      try {
        const response = await fetch(
          "https://tandem01.azurewebsites.net/api/gettoken",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.token;
      } catch (error) {
        console.error("Error:", error);
      }
    }

    async function callTandemApi() {
      try {
        const jwt = await getJwtToken();
        const response = await fetch("/TandemApi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            APIKey: "5eb165be933e4eb18b8882d40857266c",
            Authorization: `Bearer ${jwt}`,
            user: "sia.chen.han@synapxe.sg",
            Timestamp:
              new Date()
                .toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\//g, "-") +
              " " +
              new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }),
          },
          body: JSON.stringify({
            userId: "notebudy@singhealth.com.sg",
            func_bypass: "",
            message:
              prompt +
              "\n*********************************************\n Refer below actual transcript:\n\n" +
              encryptedText,
            chat_model: "gpt4",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let summary = ""; // Define summary here
          let lastResponse = ""; // Keep track of the last response

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            const decodedChunk = decoder.decode(value);
            const lines = decodedChunk.split("\n");
            const nonEmptyLines = lines.filter(
              (line) => line !== "" && line !== "[DONE]"
            );
            const parsedLines = nonEmptyLines
              .filter((line) => {
                try {
                  JSON.parse(line.replace(/^data: /, ""));
                  return true;
                } catch {
                  return false;
                }
              })
              .map((line) => JSON.parse(line.replace(/^data: /, "")));
            setIsLoadingSummary(false); // Update the loading state

            for (const parsedLine of parsedLines) {
              if (parsedLine.response && parsedLine.response !== lastResponse) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                if (parsedLine.response.startsWith(lastResponse)) {
                  // If the new response is a continuation of the last response, only append the new part
                  summary += parsedLine.response.slice(lastResponse.length);
                } else {
                  summary += parsedLine.response;
                }
                lastResponse = parsedLine.response; // Update the last response
                setSummaryText(summary);
                setSummary(summary); // Update the state at the end of processing
              }
            }
            setIsLoadingSummary(false);
          }

          // Update the loading state
        }
      } catch (error) {
        console.error("Error:", error);
        setIsLoadingSummary(false); // Update the loading state in case of error
      }
    }

    callTandemApi();
    try {
      const jwt = await getJwtToken();
      const response = await fetch("/TandemApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          APIKey: "5eb165be933e4eb18b8882d40857266c",
          Authorization: `Bearer ${jwt}`,
          user: "sia.chen.han@synapxe.sg",
          Timestamp:
            new Date()
              .toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
              .replace(/\//g, "-") +
            " " +
            new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
        },
        body: JSON.stringify({
          userId: "notebudy@singhealth.com.sg",
          func_bypass: "",
          message:
            "You will be provided with a transcript of a conversation between a doctor and a patient in either of English, Mandarin, Indonesian or Tamil language. You need to reformat the transcript in English in a way that it is easy to read and understand. Please ensure to do proper tagging as Doctor, Patient. You can use any format provided in Sample Transcript below. Do not add any additional information to the transcript. Please replace encrypted text values with revelant masked values eg [Patient' Name] , [Patient's Email] , etc as applicable.  \n\nSample Transcript:\nDoctor: Hello, how are you?\nPatient: I am fine, thank you.\nDoctor: What brings you here today?\nPatient: I have a headache.\nDoctor: How long have you had it?\nPatient: For about a week." +
            "\n*********************************************\n Refer below actual transcript:\n\n" +
            encryptedText,
          chat_model: "gpt4",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let formatted_text = ""; // Define summary here
        let lastResponse = ""; // Keep track of the last response

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const decodedChunk = decoder.decode(value);
          const lines = decodedChunk.split("\n");
          const nonEmptyLines = lines.filter(
            (line) => line !== "" && line !== "[DONE]"
          );
          const parsedLines = nonEmptyLines
            .filter((line) => {
              try {
                JSON.parse(line.replace(/^data: /, ""));
                return true;
              } catch {
                return false;
              }
            })
            .map((line) => JSON.parse(line.replace(/^data: /, "")));
          setIsLoading(false); // Update the loading state
          setIsLoadingTranscript(false);

          for (const parsedLine of parsedLines) {
            if (parsedLine.response && parsedLine.response !== lastResponse) {
              await new Promise((resolve) => setTimeout(resolve, 75));
              if (parsedLine.response.startsWith(lastResponse)) {
                // If the new response is a continuation of the last response, only append the new part
                formatted_text += parsedLine.response.slice(
                  lastResponse.length
                );
              } else {
                formatted_text += parsedLine.response;
              }
              lastResponse = parsedLine.response; // Update the last response
              setFormattedTranscript(formatted_text);
              // Update the state at the end of processing
            }
          }
          setIsLoading(false);
          setIsLoadingTranscript(false);
        }

        // Update the loading state
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoadingSummary(false); // Update the loading state in case of error
    }

    setIsLoading(false);
  };

  const handleCopy = async () => {
    try {
      // Remove HTML tags from the summary before copying
      const plainTextSummary = summary.replace(/<[^>]+>/g, "");
      await navigator.clipboard.writeText(plainTextSummary);
      toast({
        title: "Summary copied",
        description: "The summary has been copied to clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy failed",
        description: "Failed to copy the summary to clipboard.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Scroll the Raw Transcript box to the bottom when new transcription is added
  useEffect(() => {
    if (rawTranscriptRef.current) {
      rawTranscriptRef.current.scrollTop =
        rawTranscriptRef.current.scrollHeight;
    }
  }, [transcription]);

  // Scroll the Summary box to the bottom when new summary text is added
  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Initialize Cosmos DB client
  const formatSummaryForDisplay = (summary: string) => {
    return summary.replace(/\n/g, "<br>");
  };

  return (
    <VStack
      spacing={2}
      p={4}
      style={{
        minHeight: "100vh",
        background: `url(${shsbackground}) no-repeat center center fixed`, // Set background image here
        backgroundColor: "#FDFCFA",
        backgroundSize: "contain", // Ensure it covers the whole page
        width: "100vw", // Ensure it spans the full width
      }}
    >
      {!isAuthenticated ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="100vh"
          width="100vw"
          // bgImage={`url(${shsbackground})`}
          // bgPosition="center"
          // bgRepeat="no-repeat"
          // bgSize="cover"
        >
          <Box
            backgroundColor="rgba(255, 255, 255, 0.6)" // Semi-transparent white background
            p={8}
            borderRadius="md"
            boxShadow="lg"
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="black"
              align="center"
              mb={4}
            >
              Login to NoteBuddy
            </Text>
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              mb={4}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              mb={6}
            />
            <Button colorScheme="orange" onClick={handleLogin} width="full">
              Login
            </Button>
            <Text fontSize="sm" mt={4}>
              Note: Send email to oia@singhealth.com.sg for access
            </Text>
          </Box>
        </Box>
      ) : (
        <>
          {/* User consent form after login */}
          {!userConsent && (
            <Box
              marginTop={150}
              p={8}
              borderRadius="md"
              boxShadow="lg"
              bg="white"
            >
              <Text fontSize="xl" fontWeight="bold" color="#E54809" mb={4}>
                User Consent
              </Text>
              <Checkbox
                size="lg"
                colorScheme="orange"
                onChange={handleUserConsent}
              >
                <Text fontSize="lg">
                  The patient consented to be part of the pilot test for a
                  Generative AI powered assistive tool for clinical
                  documentation.
                </Text>
              </Checkbox>
            </Box>
          )}
          {userConsent && (
            <>
              <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Select a language</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <RadioGroup
                      onChange={handleLanguageChange}
                      value={language}
                    >
                      <Stack direction="column">
                        <Radio value="en-SG">English</Radio>
                        <Radio value="zh-CN">Mandarin</Radio>
                        <Radio value="id-ID">Malay</Radio>
                        <Radio value="ta-IN">Tamil</Radio>
                      </Stack>
                    </RadioGroup>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onClose}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Box
                w="full"
                p={4}
                display="flex"
                justifyContent="center"
                flexDirection="column"
                alignItems="center"
                mt={120}
              >
                <Select
                  placeholder="Select speciality"
                  value={selectedSpeciality}
                  onChange={handleChange}
                  w={{ base: "1000%", md: "20%" }}
                  mb={4}
                >
                  <option value="END">END</option>
                  <option value="URO">Urology</option>
                  <option value="GEN">General</option>
                  {/* Add more options as required */}
                </Select>

                <Button onClick={togglePrompt}>
                  {showPrompt ? "Collapse Prompt" : "Expand Prompt"}
                </Button>

                <Collapse in={showPrompt}>
                  {prompt && (
                    <Textarea
                      mt={4}
                      w="80vw"
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      size="sm"
                      resize="vertical"
                      borderRadius="md"
                      height={500}
                      p={2}
                    />
                  )}
                </Collapse>
              </Box>

              <HStack spacing={4} width="100%" justifyContent="center">
                <Button
                  colorScheme={isGenerateLoading ? "blue" : "white"}
                  onClick={regererateSummary}
                  marginTop={0}
                >
                  {isGenerateLoading ? "Regenerate" : ""}
                </Button>
                <Button
                  colorScheme={recording ? "blue" : "orange"}
                  onClick={toggleRecording}
                  marginTop={0}
                >
                  {recording ? "Stop Recording" : "Start Recording"}
                </Button>

                <Button
                  colorScheme={isGenerateLoading ? "green" : "white"}
                  onClick={handleGenerate}
                  marginTop={0}
                >
                  {isGenerateLoading ? "Get code" : ""}
                </Button>

                <Button
                  colorScheme={isGenerateLoading ? "red" : "white"}
                  onClick={handleClearAll}
                  marginTop={0}
                >
                  {isGenerateLoading ? "Clear" : ""}
                </Button>
              </HStack>

              <Text fontSize="3xl" fontWeight="bold" color="blackAlpha.700">
                {uCode}
              </Text>

              {recording && (
                <>
                  <img
                    src={soundwave}
                    alt="Soundwave"
                    width="100"
                    height="100"
                  />
                  <Text fontSize={25} fontWeight={"bold"} color={"orange"}>
                    {Math.floor(timer / 3600)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor((timer % 3600) / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timer % 60).toString().padStart(2, "0")}
                  </Text>
                </>
              )}

              <HStack spacing={4} width="100%">
                <Tabs
                  flex="1"
                  width="100%"
                  height={600}
                  p={3}
                  borderRadius="md"
                  boxShadow="lg"
                  bg="white"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="#E54809">
                    Transcript
                  </Text>
                  <TabList>
                    <Tab
                      _selected={{ color: "#E54809", borderColor: "#E54809" }}
                    >
                      Raw Transcript
                    </Tab>
                    <Tab
                      _selected={{ color: "#E54809", borderColor: "#E54809" }}
                    >
                      Formatted Transcript
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel
                      ref={rawTranscriptRef}
                      width="100%"
                      height={475}
                      p={3}
                      borderRadius="md"
                      overflow="auto"
                    >
                      {transcription.map((t, index) => (
                        <p
                          key={index}
                          style={{
                            color: t.speakerId === "Guest-1" ? "blue" : "red",
                          }}
                        >
                          {t.speakerId} : {t.text}
                        </p>
                      ))}
                    </TabPanel>
                    <TabPanel
                      width="100%"
                      height={475}
                      p={3}
                      borderRadius="md"
                      overflow="auto"
                    >
                      {isLoadingTranscript ? (
                        <Spinner
                          label="Formating transcript, please wait..."
                          size="xl"
                          color="#E54809"
                        />
                      ) : (
                        formattedTranscript
                          .split("\n")
                          .filter((line) => line.trim() !== ":")
                          .map((line, index) => {
                            const [speaker, text] = line.split(": ");
                            return (
                              <p
                                key={index}
                                style={{
                                  color: speaker === "Doctor" ? "blue" : "red",
                                }}
                              >
                                {speaker} : {text}
                              </p>
                            );
                          })
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                <Box
                  ref={summaryRef}
                  flex="1"
                  width="100%"
                  height={600}
                  p={3}
                  borderRadius="md"
                  boxShadow="lg"
                  bg="white"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="#E54809">
                    Summary
                  </Text>
                  {isEditing ? (
                    <Button onClick={handleSave} m={2}>
                      Save
                    </Button>
                  ) : (
                    <Button onClick={handleEdit} m={2}>
                      Edit (with HTML)
                    </Button>
                  )}{" "}
                  <Button onClick={handleCopy} m={2}>
                    Copy
                  </Button>
                  {isLoadingSummary ? (
                    <Spinner size="xl" color="#E54809" />
                  ) : isEditing ? (
                    <Textarea
                      width="100%"
                      height={475}
                      p={3}
                      borderRadius="md"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      overflow={"auto"}
                    />
                  ) : (
                    <Box
                      width="100%"
                      height={475}
                      p={3}
                      borderRadius="md"
                      overflow="auto"
                      dangerouslySetInnerHTML={{
                        //Define summary before calling split
                        __html: summary
                          ? summary
                              .split("\n")
                              .map((line) => `<p>${line}</br></p>`)
                              .join("")
                          : "",
                      }}
                    />
                  )}
                </Box>
              </HStack>
            </>
          )}
        </>
      )}
    </VStack>
  );
};

export default UserRecording;
