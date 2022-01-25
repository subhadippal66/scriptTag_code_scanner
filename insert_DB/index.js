const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');


// config

const txt_file_relative_path_READ = "./read_file/test_003.txt";
const html_file_relative_path_WRITE = "./write_file/1.html";

// mysql config
const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'my_table'
})

async function processLineByLine() {
    const fileStream = fs.createReadStream(txt_file_relative_path_READ);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
   
  
    let line_no = 1;
    for await (const line of rl) {
    //   console.log(`Line ${line_no}: ${line}`);

      decodeLine(line);
      line_no++;
    }
}
  
processLineByLine();

var updated_path = ""; 

function decodeLine(line_str){

    // path check
    // if(line_str[0] == '/'){
    if(line_str.substring(0, 8) == 'justcall'){
        updated_path = line_str;
        return;
    }

    //line no check

    let first_appreance = line_str.indexOf("<script");
    

    if(first_appreance != -1){
        

        let regex = /\d+/g;
        let string = line_str.substring(0,first_appreance);
        let matches = string.match(regex);  

        if(matches){
            let line_no = matches[0];
            
            let end_script = line_str.indexOf("</script>");

            if(end_script != -1){

                let script_tag = line_str.substring(first_appreance, end_script+9);

                // console.log(line_no);
                // console.log(script_tag);
                // console.log(updated_path);

                // insert into DB

                insertIntoTable(line_no, script_tag, updated_path);

            }
        }
    }
}

// write script tag into a file
var logger = fs.createWriteStream(html_file_relative_path_WRITE, {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

// mysql


function insertIntoTable(line_no, script_tag, updated_path){
    pool.getConnection((err, connection) => {
        if(err) throw err

        let insert_query = "INSERT INTO `script_location` (`line_no`, `script`, `path`, `version`, `vulnerable`, `zap_col_1`) VALUES ('"+line_no+"', '"+script_tag+"', '"+updated_path+"', '0', '2', '');"

        // console.log(insert_query);

        connection.query(insert_query, (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {                
                // console.log(rows);

                // console.log('.');

                // write into a file
                logger.write("\n"+script_tag);


            } else {
                console.log(err);
            }            
        })
    })
}
