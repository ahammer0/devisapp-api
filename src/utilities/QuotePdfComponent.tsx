import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { full_quote } from "../types/quotes";
import { user } from "../types/users";
import { work } from "../types/works";
import { toFormDateString } from "./datesHandlers";
import ReactPDF from "@react-pdf/renderer";
// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontSize: 12,
    padding: 20,
    fontFamily: "Helvetica",
    minHeight: "100vh",
    flexDirection: "column",
  },
  header: {
    margin: 10,
    padding: 10,
    border: "1px solid black",
  },
  infosClient: {
    marginVertical: 20,
  },
  h1: {
    fontSize: 30,
    textAlign: "center",
  },
  quoteContent: {
    padding: 10,
    width: "100%",
    flexGrow: 1,
    flexBasis: "auto",
  },
  quoteSection: {
    marginBottom: 20,
  },
  quoteLine: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
  },
  quoteLineName: {
    padding: 5,
    flexBasis: "auto",
    flexGrow: 1,
  },
  quoteLineHeader: {
    fontWeight: "bold",
  },
  quoteLineQuantity: {
    padding: 5,
    flexBasis: 80,
  },
  quoteLinePu: {
    padding: 5,
    flexBasis: 70,
    textAlign: "right",
  },
  footer: {
    position: "static",
    border: "1px solid black",
    minHeight: 80,
    padding: 10,
    bottom: 0,
    marginVertical: 10,
  },
  pageNumber: {
    position: "static",
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
});

// Create Document Component
const QuotePdfComponent = ({
  quote,
  user,
  works,
}: {
  quote: full_quote;
  user: user;
  works: work[];
}) => {
  const sections = quote.quote_elements.reduce((acc, el) => {
    if (acc.includes(el.quote_section)) {
      return acc;
    }
    return [...acc, el.quote_section];
  }, [] as string[]);

  const getSectionTotal = (section: string) => {
    return quote.quote_elements.reduce((acc, el) => {
      if (el.quote_section === section) {
        const wo = works.find((e) => e.id === el.work_id);
        if (!wo) throw new Error("Work not found");
        return acc + (el.quantity * wo.unit_price * (100 - el.discount)) / 100;
      }
      return acc;
    }, 0);
  };
  const getGranTotalHT = () => {
    return (
      (quote.quote_elements.reduce((acc, el) => {
        const wo = works.find((e) => e.id === el.work_id);
        if (!wo) throw new Error("Work not found");
        return acc + (el.quantity * wo.unit_price * (100 - el.discount)) / 100;
      }, 0) *
        (100 - quote.global_discount)) /
      100
    );
  };
  const getGranTotalTVA = () => {
    return (
      (quote.quote_elements.reduce((acc, el) => {
        const wo = works.find((e) => e.id === el.work_id);
        if (!wo) throw new Error("Work not found");

        return (
          acc +
          ((el.quantity * wo.unit_price * (100 - el.discount)) / 100) *
            (parseFloat(el.vat) / 100)
        );
      }, 0) *
        (100 - quote.global_discount)) /
      100
    );
  };
  const getGranTotalTTC = () => {
    return getGranTotalHT() + getGranTotalTVA();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.h1}>Devis</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text>{user.company_name}</Text>
              <Text>Siret: {user.siret}</Text>
              <Text style={{ textOverflow: "ellipsis" }}>
                {user.company_address}
              </Text>
              <Text>{user.email}</Text>
              <View style={styles.infosClient}>
                <Text>Pour:</Text>
                <Text>
                  {quote.customer?.first_name} {quote.customer?.last_name}
                </Text>
                <Text>{quote.customer?.street}</Text>
                <Text>
                  {quote.customer?.zip} {quote.customer?.city}
                </Text>
                <Text>{quote.customer?.phone}</Text>
                <Text>{quote.customer?.email}</Text>
              </View>
            </View>
            <View style={{ textAlign: "right" }}>
              <Text>Devis n°{quote.id}</Text>
              <Text>
                Date d'expiration: {toFormDateString(quote.expires_at)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.quoteContent}>
          {sections.map((section) => {
            const elems = quote.quote_elements.filter(
              (el) => el.quote_section === section,
            );
            return (
              <View style={styles.quoteSection} key={section}>
                <Text>Section: {section}</Text>
                <View
                  /* //ts-ignore */
                  style={[
                    styles.quoteLine,
                    { borderBottom: "1px solid black" },
                  ]}
                >
                  <Text style={[styles.quoteLineName, styles.quoteLineHeader]}>
                    Désignation
                  </Text>
                  <Text
                    style={[styles.quoteLineQuantity, styles.quoteLineHeader]}
                  >
                    Quantité
                  </Text>
                  <Text style={[styles.quoteLinePu, styles.quoteLineHeader]}>
                    P/u
                  </Text>
                  <Text style={[styles.quoteLinePu, styles.quoteLineHeader]}>
                    s/tot
                  </Text>
                </View>

                {elems.map((el) => {
                  const wo = works.find((e) => e.id === el.work_id);

                  return (
                    <view
                      style={styles.quoteLine}
                      key={`${el.work_id}${el.quote_section}`}
                    >
                      <Text style={styles.quoteLineName}>{wo?.name}</Text>
                      <Text style={styles.quoteLineQuantity}>
                        {el.quantity}
                      </Text>
                      <Text style={styles.quoteLinePu}>
                        {wo?.unit_price.toFixed(2)}
                      </Text>
                      <Text style={styles.quoteLinePu}>
                        {wo &&
                          (
                            (wo?.unit_price *
                              el.quantity *
                              (100 - el.discount)) /
                            100
                          ).toFixed(2)}{" "}
                        €
                      </Text>
                    </view>
                  );
                })}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginVertical: 5,
                  }}
                >
                  <Text style={{ padding: 7, border: "1px solid #afafaf" }}>
                    Sous-Total HT: {getSectionTotal(section).toFixed(2)}€
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <View
          wrap={false}
          style={{
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Text
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  border: "2px solid black",
                  padding: 10,
                  margin: 0,
                }}
              >
                TOTAL HT: {getGranTotalHT().toFixed(2)} €
              </Text>
              <Text
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  border: "2px solid black",
                  padding: 10,
                  margin: 0,
                }}
              >
                TVA: {getGranTotalTVA().toFixed(2)} €
              </Text>
              <Text
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  border: "2px solid black",
                  padding: 10,
                  margin: 0,
                }}
              >
                TOTAL TTC: {getGranTotalTTC().toFixed(2)} €
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>Mentions Générales :{user.quote_infos}</Text>
            <Text>Mentions Particullières: {quote.general_infos}</Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                width: "50%",
                marginVertical: 10,
                height: 100,
                border: "1px solid black",
                padding: 10,
              }}
            >
              <Text>Signature et mention "bon pour Accord"</Text>
            </View>
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

const getQuotePdfStream = async (
  user: user,
  quote: full_quote,
  works: work[],
) => {
  return ReactPDF.renderToStream(
    <QuotePdfComponent quote={quote} user={user} works={works} />,
  );
};
export default getQuotePdfStream;
