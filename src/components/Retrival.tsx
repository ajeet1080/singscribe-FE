import React, { useState } from "react";
import { CosmosClient } from "@azure/cosmos";
import {
  VStack,
  HStack,
  Box,
  Text,
  Input,
  Button,
  useToast,
} from "@chakra-ui/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import shsbackground from "../assets/SingScribe_Design.png";

const endpoint = "https://singscribe-cosmosdb.documents.azure.com:443/";
const key =
  "SjcL1sPNRelpz9IyBzXL1Aww9smwQALhmPxGikKauJ8H0C1CzXQU3SZ09Scfyg85CxQcPrWNAmS8ACDb2jcm4Q==";
const databaseId = "notebuddy";
const containerId = "summaries";
const cosmosClient = new CosmosClient({ endpoint, key });
const Retrival: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [uniqueCode, setUniqueCode] = useState<string>("");
  const toast = useToast();
  const [summary, setSummary] = useState<string>("");
  const [updatedSummary, setUpdatedSummary] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // Function to retrieve transcript and summary from Cosmos DB
  const retrieveFromCosmosDB = async (uniqueCode: string) => {
    setSummary("");
    setData(null);

    try {
      const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [
          {
            name: "@id",
            value: uniqueCode,
          },
        ],
      };
      const { resources } = await container.items.query(querySpec).fetchAll();
      if (resources && resources.length > 0) {
        setData(resources[0]);
        setSummary(resources[0].summary);
      } else {
        toast({
          title: "Data not found",
          description: "No data found with the provided ID.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        setData(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while retrieving data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error retrieving data from Cosmos DB", error);
    }
  };
  // Function to format transcript with color coding and line breaks
  const formatTranscript = (transcript: string) => {
    if (!transcript) return "No transcript available";
    // Replace newline characters with <br/> and apply color coding
    const formattedTranscript = transcript
      .replace(/\n/g, "<br/>") // Replace newlines with HTML line breaks
      .replace(
        /Doctor:/g,
        "<span style='color: blue; font-weight: bold;'>Doctor:</span>"
      )
      .replace(
        /Patient:/g,
        "<span style='color: red; font-weight: bold;'>Patient:</span>"
      );
    return { __html: formattedTranscript };
  };
  const editorStyle = {
    height: "400px",
    fontSize: "20px", // Set your desired font size here
  };
  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }], // custom dropdown
      ["bold", "italic", "underline"], // toggled buttons
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"], // add's image support
      ["clean"], // remove formatting button
    ],
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

  const updateSummaryInCosmosDB = async () => {
    if (!data || !summary) {
      toast({
        title: "Error",
        description: "No data or updated summary to save.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      return;
    }

    try {
      const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
      });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
      });
      const item = {
        id: data.id,
        ...data,
        updatedSummary: summary, // Update the summary field
      };
      const { resource } = await container.item(data.id).replace(item);

      toast({
        title: "Success",
        description: "Summary updated successfully in Cosmos DB.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false); // Exit editing mode
      setUpdatedSummary(summary); // Update local state
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the summary.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error updating summary in Cosmos DB", error);
    }
  };

  return (
    <VStack
      spacing={6}
      p={4}
      style={{
        minHeight: "100vh",
        background: `url(${shsbackground}) no-repeat center center fixed`, // Set background image here
        backgroundColor: "#FDFCFA", // Set background color here
        backgroundSize: "contain", // Ensure it covers the whole page
        width: "100vw", // Ensure it spans the full width
        justifyContent: "flex-start",
      }}
    >
      <HStack width="100%" justifyContent="flex-end" spacing={6}>
        <Input
          padding={7}
          placeholder="Enter code"
          value={uniqueCode}
          onChange={(e) => setUniqueCode(e.target.value)}
          width={40}
        />
        <Button
          colorScheme="blue"
          onClick={() => retrieveFromCosmosDB(uniqueCode)}
          bgColor={uniqueCode ? "#E54809" : "#A0AEC0"}
          marginEnd={50}
        >
          Retrieve Data
        </Button>
      </HStack>
      {data && (
        <HStack spacing={8} align="start" marginTop={5}>
          <VStack spacing={4} align="stretch" width="100%">
            <Text fontSize="2xl" fontWeight="bold" color="#E54809">
              Transcript
            </Text>
            <Box
              p={4}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              width="100%"
            >
              {/* Using dangerouslySetInnerHTML to render the formatted transcript */}
              <div
                dangerouslySetInnerHTML={
                  formatTranscript(data.transcript) as { __html: string }
                }
              />
            </Box>
          </VStack>
          <VStack spacing={4} align="stretch" width="100%">
            <HStack spacing={4} align="center">
              <Text fontSize="2xl" fontWeight="bold" color="#E54809">
                Summary
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => setIsEditing(true)}
                width="10%"
              >
                Edit
              </Button>{" "}
              <Button onClick={handleCopy} m={2}>
                Copy
              </Button>
              {isEditing ? (
                <Button
                  colorScheme="green"
                  onClick={updateSummaryInCosmosDB}
                  width="10%"
                >
                  Save
                </Button>
              ) : null}
            </HStack>
            {isEditing ? (
              <>
                <ReactQuill
                  theme="snow"
                  style={editorStyle}
                  value={summary} // Use summary state here
                  onChange={setSummary} // Update summary state on change
                  modules={modules}
                />
              </>
            ) : (
              <Box
                p={4}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                width="100%"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            )}
          </VStack>
        </HStack>
      )}
    </VStack>
  );
};
export default Retrival;
