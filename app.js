const express = require('express');
const app = express();
const axios = require('axios');
const Instagram = require('./instagram-web-api/index');
require("dotenv").config();
const fs = require('fs');


const client = new Instagram({
	username: process.env.UR_INSTA_USERNAME,
	password: process.env.UR_INSTA_PASSWORD,
})


const findUserId = async () =>
{
	const instagram =  await client.getUserByUsername({ username: process.env.CLIENT_USERNAME }).then((res) => res).catch(err => err)
	const position = instagram.search('profile_id":"');
	const userId = instagram.substring(position + 13, position + 24);
	return (userId);
}

const instaGrab = async () => 
{
	let Posts = [];
	const uId = await findUserId();
	const Edges = await client.getPhotosByUsername({id: uId})
	.then(res => res.user.edge_owner_to_timeline_media.edges.map((edge) => edge))
	for(let i = 0; i < Edges.length; i++)
	{
		if (!Edges[i].node.edge_sidecar_to_children)
			Posts.push(Edges[i].node.display_url)
		else
		{
			const length = Edges[i].node.edge_sidecar_to_children.edges.length;
			for (let o = 0; o < length; o++)
				Posts.push(Edges[i].node.edge_sidecar_to_children.edges[o].node.display_url);
		}
	}
	return Posts
}

const randomFile = () =>
{
	if (!fs.existsSync('./downloaded_files')) 
	{
		fs.mkdirSync('./downloaded_files', {
			recursive: true
		});
	}
	let random = (Math.random() + 1).toString(33).substring(8)
	const file = fs.createWriteStream('downloaded_files/' + random + '.jpg');

	return file;
}

const downloadFiles = async () =>
{
	try
	{
		const data = await instaGrab();
		for(let i = 0; i < data.length; i++)
		{
			await axios({
				url: data[i],
				method: 'GET',
				responseType: 'stream'
			}).then(res => {

				const file = randomFile();
				res.data.pipe(file);
				file.on('finish', () =>
				{
					file.close();
					console.log('Download Complete')
				})
			})
		}
	}
	catch(error)
	{
		console.log('Error ', error);
	}
}

downloadFiles()
